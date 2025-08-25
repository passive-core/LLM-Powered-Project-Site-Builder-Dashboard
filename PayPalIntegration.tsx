import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { 
  CreditCard, DollarSign, TrendingUp, Users, ShoppingCart, 
  Settings, Calendar, Mail, MessageSquare, Share2, 
  CheckCircle, AlertCircle, Clock, RefreshCw, ExternalLink, 
  Zap, Bot, Webhook, Database, Cloud, Shield, Lock,
  Receipt, PieChart, BarChart3, Activity, Download
} from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface PayPalAccount {
  id: string
  email: string
  merchantId: string
  clientId: string
  environment: 'sandbox' | 'live'
  status: 'active' | 'pending' | 'suspended'
  balance: {
    available: number
    pending: number
    currency: string
  }
  permissions: string[]
  webhookUrl?: string
  createdAt: string
  lastSync: string
}

interface PayPalTransaction {
  id: string
  type: 'payment' | 'refund' | 'subscription' | 'dispute'
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  amount: number
  currency: string
  description: string
  payerEmail?: string
  payerName?: string
  merchantReference?: string
  createdAt: string
  updatedAt: string
  fees: number
  netAmount: number
}

interface PayPalProduct {
  id: string
  name: string
  description: string
  type: 'physical' | 'digital' | 'service'
  category: string
  price: number
  currency: string
  status: 'active' | 'inactive'
  paypalProductId?: string
  createdAt: string
}

interface PayPalSubscription {
  id: string
  productId: string
  planId: string
  subscriberEmail: string
  status: 'active' | 'cancelled' | 'suspended' | 'expired'
  currentPeriodStart: string
  currentPeriodEnd: string
  amount: number
  currency: string
  interval: 'monthly' | 'yearly'
  createdAt: string
}

interface PaymentLink {
  id: string
  name: string
  description: string
  amount: number
  currency: string
  type: 'one_time' | 'subscription'
  url: string
  qrCode: string
  expiresAt?: string
  status: 'active' | 'expired' | 'disabled'
  clickCount: number
  conversionCount: number
  createdAt: string
}

export default function PayPalIntegration() {
  const { user } = useAuth()
  const [account, setAccount] = useState<PayPalAccount | null>(null)
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([])
  const [products, setProducts] = useState<PayPalProduct[]>([])
  const [subscriptions, setSubscriptions] = useState<PayPalSubscription[]>([])
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (user) {
      loadPayPalData()
    }
  }, [user])

  const loadPayPalData = async () => {
    try {
      setIsLoading(true)
      
      // Load PayPal account info
      const accountData = await loadPayPalAccount()
      setAccount(accountData)
      
      if (accountData) {
        // Load transactions, products, etc.
        await Promise.all([
          loadTransactions(),
          loadProducts(),
          loadSubscriptions(),
          loadPaymentLinks()
        ])
      }
    } catch (error) {
      console.error('Failed to load PayPal data:', error)
      toast.error('Failed to load PayPal data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPayPalAccount = async (): Promise<PayPalAccount | null> => {
    try {
      // Check if user has PayPal integration
      const integrations = await blink.db.toolIntegrations.list({
        where: { 
          userId: user?.id,
          toolName: 'paypal',
          isActive: '1'
        }
      })
      
      if (integrations.length === 0) return null
      
      const integration = integrations[0]
      const config = JSON.parse(integration.config || '{}')
      
      // Simulate PayPal account data
      return {
        id: integration.id,
        email: config.email || 'merchant@example.com',
        merchantId: config.merchantId || 'MERCHANT123',
        clientId: config.clientId || 'CLIENT123',
        environment: config.environment || 'sandbox',
        status: 'active',
        balance: {
          available: 2847.50,
          pending: 156.25,
          currency: 'USD'
        },
        permissions: ['payments', 'refunds', 'subscriptions'],
        webhookUrl: `https://llm-project-site-builder-dashboard-b2m28ujy.sites.blink.new/api/webhooks/paypal/${user?.id}`,
        createdAt: integration.createdAt,
        lastSync: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to load PayPal account:', error)
      return null
    }
  }

  const loadTransactions = async () => {
    // Simulate transaction data
    const mockTransactions: PayPalTransaction[] = [
      {
        id: 'txn_1',
        type: 'payment',
        status: 'completed',
        amount: 99.99,
        currency: 'USD',
        description: 'Premium Subscription',
        payerEmail: 'customer@example.com',
        payerName: 'John Doe',
        merchantReference: 'SUB_001',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        fees: 3.19,
        netAmount: 96.80
      },
      {
        id: 'txn_2',
        type: 'payment',
        status: 'completed',
        amount: 29.99,
        currency: 'USD',
        description: 'Basic Plan',
        payerEmail: 'user@example.com',
        payerName: 'Jane Smith',
        merchantReference: 'PLAN_002',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        fees: 1.17,
        netAmount: 28.82
      },
      {
        id: 'txn_3',
        type: 'refund',
        status: 'completed',
        amount: -19.99,
        currency: 'USD',
        description: 'Refund for Order #123',
        payerEmail: 'refund@example.com',
        payerName: 'Bob Johnson',
        merchantReference: 'REF_003',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        fees: -0.88,
        netAmount: -19.11
      }
    ]
    
    setTransactions(mockTransactions)
  }

  const loadProducts = async () => {
    // Simulate product data
    const mockProducts: PayPalProduct[] = [
      {
        id: 'prod_1',
        name: 'Premium Subscription',
        description: 'Monthly premium access with all features',
        type: 'digital',
        category: 'subscription',
        price: 99.99,
        currency: 'USD',
        status: 'active',
        paypalProductId: 'PROD_PREMIUM_001',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'prod_2',
        name: 'Basic Plan',
        description: 'Basic features for small teams',
        type: 'digital',
        category: 'subscription',
        price: 29.99,
        currency: 'USD',
        status: 'active',
        paypalProductId: 'PROD_BASIC_001',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    
    setProducts(mockProducts)
  }

  const loadSubscriptions = async () => {
    // Simulate subscription data
    const mockSubscriptions: PayPalSubscription[] = [
      {
        id: 'sub_1',
        productId: 'prod_1',
        planId: 'PLAN_PREMIUM_MONTHLY',
        subscriberEmail: 'customer@example.com',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 99.99,
        currency: 'USD',
        interval: 'monthly',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sub_2',
        productId: 'prod_2',
        planId: 'PLAN_BASIC_MONTHLY',
        subscriberEmail: 'user@example.com',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 29.99,
        currency: 'USD',
        interval: 'monthly',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    
    setSubscriptions(mockSubscriptions)
  }

  const loadPaymentLinks = async () => {
    // Simulate payment link data
    const mockLinks: PaymentLink[] = [
      {
        id: 'link_1',
        name: 'Premium Subscription Link',
        description: 'Direct link for premium subscription',
        amount: 99.99,
        currency: 'USD',
        type: 'subscription',
        url: 'https://paypal.me/yourstore/99.99',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        status: 'active',
        clickCount: 45,
        conversionCount: 12,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    
    setPaymentLinks(mockLinks)
  }

  const connectPayPal = async (environment: 'sandbox' | 'live', clientId: string, clientSecret: string) => {
    if (!user) return
    
    setIsConnecting(true)
    
    try {
      // Save PayPal integration
      await blink.db.toolIntegrations.create({
        id: `paypal_${Date.now()}`,
        toolName: 'paypal',
        toolType: 'payment',
        apiEndpoint: environment === 'sandbox' 
          ? 'https://api.sandbox.paypal.com' 
          : 'https://api.paypal.com',
        authToken: clientSecret,
        config: JSON.stringify({
          clientId,
          environment,
          email: user.email,
          merchantId: `MERCHANT_${Date.now()}`
        }),
        isActive: 1,
        userId: user.id
      })
      
      toast.success('PayPal connected successfully!')
      await loadPayPalData()
    } catch (error) {
      console.error('Failed to connect PayPal:', error)
      toast.error('Failed to connect PayPal')
    } finally {
      setIsConnecting(false)
    }
  }

  const createPaymentLink = async (linkData: Partial<PaymentLink>) => {
    try {
      const newLink: PaymentLink = {
        id: `link_${Date.now()}`,
        name: linkData.name || 'New Payment Link',
        description: linkData.description || '',
        amount: linkData.amount || 0,
        currency: linkData.currency || 'USD',
        type: linkData.type || 'one_time',
        url: `https://paypal.me/yourstore/${linkData.amount}`,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        status: 'active',
        clickCount: 0,
        conversionCount: 0,
        createdAt: new Date().toISOString()
      }
      
      setPaymentLinks(prev => [newLink, ...prev])
      toast.success('Payment link created!')
      return newLink
    } catch (error) {
      console.error('Failed to create payment link:', error)
      toast.error('Failed to create payment link')
    }
  }

  const createProduct = async (productData: Partial<PayPalProduct>) => {
    try {
      const newProduct: PayPalProduct = {
        id: `prod_${Date.now()}`,
        name: productData.name || 'New Product',
        description: productData.description || '',
        type: productData.type || 'digital',
        category: productData.category || 'general',
        price: productData.price || 0,
        currency: productData.currency || 'USD',
        status: 'active',
        paypalProductId: `PROD_${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      
      setProducts(prev => [newProduct, ...prev])
      toast.success('Product created!')
      return newProduct
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Failed to create product')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'text-green-500'
      case 'pending': return 'text-yellow-500'
      case 'failed': case 'cancelled': case 'suspended': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed': case 'cancelled': case 'suspended': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const calculateMetrics = () => {
    const totalRevenue = transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.netAmount, 0)
    
    const totalTransactions = transactions.filter(t => t.status === 'completed').length
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
    const conversionRate = paymentLinks.reduce((sum, link) => {
      return sum + (link.clickCount > 0 ? (link.conversionCount / link.clickCount) * 100 : 0)
    }, 0) / (paymentLinks.length || 1)
    
    return {
      totalRevenue,
      totalTransactions,
      activeSubscriptions,
      conversionRate
    }
  }

  const metrics = calculateMetrics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PayPal data...</p>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">PayPal Integration</h1>
          <p className="text-muted-foreground">Connect your PayPal account to start accepting payments</p>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              Connect PayPal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PayPalConnectionForm onConnect={connectPayPal} isConnecting={isConnecting} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PayPal Dashboard</h1>
          <p className="text-muted-foreground">Manage your PayPal payments and subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
          <span className="text-sm">Advanced Mode</span>
        </div>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg text-white">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>PayPal Account</CardTitle>
                <p className="text-sm text-muted-foreground">{account.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                {account.status}
              </Badge>
              <Badge variant="outline">{account.environment}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(account.balance.available, account.balance.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Balance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(account.balance.pending, account.balance.currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{metrics.activeSubscriptions}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="links">Payment Links</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'payment' ? 'bg-green-100 text-green-600' :
                        transaction.type === 'refund' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {transaction.type === 'payment' ? <DollarSign className="w-4 h-4" /> :
                         transaction.type === 'refund' ? <RefreshCw className="w-4 h-4" /> :
                         <Receipt className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-medium">{transaction.description}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{transaction.payerName || transaction.payerEmail}</span>
                          <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                          {transaction.merchantReference && (
                            <span>Ref: {transaction.merchantReference}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-bold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Net: {formatCurrency(transaction.netAmount, transaction.currency)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Products</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                </DialogHeader>
                <ProductForm onSubmit={createProduct} />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Price</span>
                      <span className="font-medium">
                        {formatCurrency(product.price, product.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Type</span>
                      <Badge variant="outline">{product.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Category</span>
                      <span className="text-muted-foreground">{product.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Subscriptions</h2>
            <Button>
              <Users className="w-4 h-4 mr-2" />
              Manage Plans
            </Button>
          </div>
          
          <div className="space-y-4">
            {subscriptions.map((subscription) => {
              const product = products.find(p => p.id === subscription.productId)
              
              return (
                <Card key={subscription.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">{product?.name || 'Unknown Product'}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{subscription.subscriberEmail}</span>
                            <span>Started: {new Date(subscription.createdAt).toLocaleDateString()}</span>
                            <span>Next: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold">
                            {formatCurrency(subscription.amount, subscription.currency)}
                          </span>
                          <span className="text-sm text-muted-foreground">/{subscription.interval}</span>
                          {getStatusIcon(subscription.status)}
                        </div>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Links</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Payment Link</DialogTitle>
                </DialogHeader>
                <PaymentLinkForm onSubmit={createPaymentLink} />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {paymentLinks.map((link) => (
              <Card key={link.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">{link.name}</h3>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Clicks: {link.clickCount}</span>
                          <span>Conversions: {link.conversionCount}</span>
                          <span>Rate: {link.clickCount > 0 ? ((link.conversionCount / link.clickCount) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold">
                          {formatCurrency(link.amount, link.currency)}
                        </span>
                        <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                          {link.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          navigator.clipboard.writeText(link.url)
                          toast.success('Link copied!')
                        }}>
                          Copy Link
                        </Button>
                        <Button size="sm" variant="outline">
                          QR Code
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Revenue chart would go here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Transaction Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Transaction breakdown chart would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// PayPal Connection Form Component
function PayPalConnectionForm({ onConnect, isConnecting }: {
  onConnect: (environment: 'sandbox' | 'live', clientId: string, clientSecret: string) => void
  isConnecting: boolean
}) {
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !clientSecret) return
    onConnect(environment, clientId, clientSecret)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Environment</label>
        <Select value={environment} onValueChange={(value: any) => setEnvironment(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
            <SelectItem value="live">Live (Production)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Client ID</label>
        <Input
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Your PayPal Client ID"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Client Secret</label>
        <Input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Your PayPal Client Secret"
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isConnecting}>
        {isConnecting ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect PayPal
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        Get your PayPal API credentials from the{' '}
        <a href="https://developer.paypal.com/developer/applications/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          PayPal Developer Dashboard
        </a>
      </p>
    </form>
  )
}

// Product Form Component
function ProductForm({ onSubmit }: {
  onSubmit: (product: Partial<PayPalProduct>) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState<'physical' | 'digital' | 'service'>('digital')
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return

    onSubmit({
      name,
      description,
      price: parseFloat(price),
      type,
      category: category || 'general'
    })

    // Reset form
    setName('')
    setDescription('')
    setPrice('')
    setCategory('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Product Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Premium Subscription"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your product..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Price (USD)</label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="99.99"
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={type} onValueChange={(value: any) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="subscription, software, etc."
        />
      </div>
      
      <Button type="submit" className="w-full">
        Create Product
      </Button>
    </form>
  )
}

// Payment Link Form Component
function PaymentLinkForm({ onSubmit }: {
  onSubmit: (link: Partial<PaymentLink>) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'one_time' | 'subscription'>('one_time')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return

    onSubmit({
      name,
      description,
      amount: parseFloat(amount),
      type
    })

    // Reset form
    setName('')
    setDescription('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Link Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Premium Subscription Link"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this payment is for..."
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="99.99"
            required
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={type} onValueChange={(value: any) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One-time Payment</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full">
        Create Payment Link
      </Button>
    </form>
  )
}