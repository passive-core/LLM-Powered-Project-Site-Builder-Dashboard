import React, { useEffect, useState } from 'react'
import blink from '../blink/client'
import { toast } from 'react-hot-toast'

export default function BetsPage() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [selection, setSelection] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const me = await blink.auth.me()
        if (!mounted) return
        setUser(me)

        // fetch user orders
        if (me?.id) {
          const list = await blink.db.betsOrders.list({
            where: { userId: me.id },
            orderBy: { createdAt: 'desc' },
            limit: 50
          })
          if (mounted) setOrders(list || [])
        }
      } catch (err) {
        console.error('Failed to init BetsPage', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const validate = () => {
    if (!user?.id) {
      toast.error('Please sign in to place an order')
      return false
    }
    if (!selection.trim()) {
      toast.error('Please enter a selection')
      return false
    }
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount greater than 0')
      return false
    }
    return true
  }

  const createOrder = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const id = `order_${Date.now()}`
    const optimistic = {
      id,
      userId: user.id,
      projectId: null,
      amount: String(amount),
      selection,
      status: 'placing',
      createdAt: new Date().toISOString()
    }

    // optimistic UI
    setOrders(prev => [optimistic, ...prev])

    try {
      const created = await blink.db.betsOrders.create({
        id,
        userId: user.id,
        projectId: null,
        amount: String(amount),
        selection,
        status: 'placed'
      })

      // replace optimistic entry with returned record
      setOrders(prev => prev.map(o => (o.id === id ? created : o)))
      toast.success('Order placed')
      setSelection('')
      setAmount('')
    } catch (err) {
      console.error('Failed to create order', err)
      // rollback optimistic
      setOrders(prev => prev.filter(o => o.id !== id))
      toast.error('Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Loading Bets...</div>

  return (
    <div className="p-6 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Bets — Place an Order</h2>

      <form onSubmit={createOrder} className="grid grid-cols-1 gap-3 max-w-md">
        <label className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1">Selection</span>
          <input
            className="border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            placeholder="e.g. Team A wins"
            disabled={submitting}
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-muted-foreground mb-1">Amount</span>
          <input
            className="border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            type="number"
            value={amount as any}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="Amount (USD)"
            disabled={submitting}
            min={1}
          />
        </label>

        <div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      </form>

      <section className="mt-6">
        <h3 className="text-lg font-medium mb-2">Your recent orders</h3>
        <div className="space-y-2">
          {orders.length === 0 && <div className="text-sm text-muted-foreground">No orders yet</div>}
          {orders.map((o) => (
            <div key={o.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{o.selection}</div>
                <div className="text-sm text-muted-foreground">${Number(o.amount).toFixed(2)} — {o.status}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(o.createdAt || o.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
