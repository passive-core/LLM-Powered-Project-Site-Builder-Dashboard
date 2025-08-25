import React, { useEffect, useState } from 'react'
import services from '../services/services.config.json'
import { Button } from './ui/Button'
import blink from '../blink/client'

export function ServiceAdminPanel() {
  const [domains, setDomains] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Listen to auth state and fetch domains when user is available
    const unsubscribe = blink.auth.onAuthStateChanged((state: any) => {
      setUser(state.user)
      if (state.user?.id) {
        fetchDomains(state.user.id)
      }
    })

    return unsubscribe
  }, [])

  const fetchDomains = async (userId: string) => {
    setLoading(true)
    try {
      // List domains for the current user
      const list = await blink.db.domains.list({ where: { userId } })
      setDomains(list || [])
    } catch (err) {
      console.error('Failed to load domains', err)
    } finally {
      setLoading(false)
    }
  }

  const addDomain = async () => {
    if (!input.trim() || !user?.id) return
    setSaving(true)
    try {
      const id = `dom_${Date.now()}`
      await blink.db.domains.create({ id, domain: input.trim(), userId: user.id })
      setInput('')
      await fetchDomains(user.id)
    } catch (err) {
      console.error('Failed to save domain', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 border rounded space-y-4">
      <h4 className="font-semibold">Services</h4>

      {services.map((s: any) => (
        <div key={s.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-muted-foreground">{s.description}</div>
          </div>
          <div>
            <Button size="sm" variant={s.enabled ? 'default' : 'outline'}>
              {s.enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      ))}

      <div className="pt-2 border-t" />

      <h4 className="font-semibold">Custom Domains</h4>
      <p className="text-sm text-muted-foreground">Add a domain you control so the platform can reference it later when publishing projects.</p>

      <div className="flex items-center space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="example.com"
          className="flex-1 border border-border rounded px-3 py-2"
        />
        <Button size="sm" onClick={addDomain} disabled={!input.trim() || saving}>
          {saving ? 'Saving...' : 'Add Domain'}
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading domains...</div>
      ) : (
        <div>
          {domains.length === 0 ? (
            <div className="text-sm text-muted-foreground">No domains added yet</div>
          ) : (
            <ul className="space-y-2">
              {domains.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="truncate">{d.domain}</div>
                  <div className="text-sm text-muted-foreground">{d.createdAt || ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
