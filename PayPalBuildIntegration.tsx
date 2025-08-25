import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Switch } from './ui/switch'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import {
  CreditCard, DollarSign, TrendingUp, Calendar, Clock,
  CheckCircle, AlertCircle, RefreshCw, Download, Upload,
  Settings, Users, BarChart3, PieChart, Target,
  Zap, Code, Globe, Shield, Bell, Archive,
  Plus, Edit, Trash2, Search, Filter, ExternalLink
} from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface PayPalTransaction {
  id: string
  type: 'payment' | 'refund' | 'subscription' | 'payout'
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  amount: number
  currency: string
  description: string
  buildId?: string
  buildType?: string
  clientEmail?: string
  clientName?: string
  paypalTransactionId: string
  createdAt: string
  completedAt?: string
  feeAmount: number
  netAmount: number
  metadata: {
    buildComplexity?: 'simple' | 'medium' | 'complex' | 'enterprise'
    estimatedHours?: number
    technologies?: string[]
    features?: string[]
    clientRequirements?: string
  }
}

interface BuildPackage {
  id: string
  name: string
  description: string
  basePrice: number
  features: string[]
  estimatedDays: number
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise'
  technologies: string[]
  isActive: boolean
  popularity: number
}

interface PayPalConfig {
  clientId: string
  clientSecret: string
  environment: 'sandbox' | 'live'
  webhookId: string
  autoInvoicing: boolean
  defaultCurrency: string
  taxRate: number
  paymentTerms: number
}

interface BuildRequest {
  id: string
  clientName: string
  clientEmail: string
  projectTitle: string
  description: string
  packageId: string
  customizations: string[]
  totalAmount: number
  status: 'quote' | 'approved' | 'in-progress' | 'completed' | 'delivered'
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded'
  createdAt: string
  dueDate?: string
  paypalInvoiceId?: string
  transactionId?: string
}

const BUILD_PACKAGES: BuildPackage[] = [
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Professional single-page website with modern design',
    basePrice: 299,
    features: ['Responsive Design', 'SEO Optimized', 'Contact Form', 'Analytics'],
    estimatedDays: 2,
    complexity: 'simple',
    technologies: ['React', 'Tailwind CSS', 'Vite'],
    isActive: true,
    popularity: 85
  },
  {
    id: 'business-website',
    name: 'Business Website',
    description: 'Multi-page business website with CMS',
    basePrice: 799,
    features: ['Multi-page', 'CMS Integration', 'Blog', 'E-commerce Ready', 'SEO'],
    estimatedDays: 5,
    complexity: 'medium',
    technologies: ['Next.js', 'Tailwind CSS', 'Strapi CMS'],
    isActive: true,
    popularity: 92
  },
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Full-featured web application with authentication',
    basePrice: 1499,
    features: ['User Authentication', 'Database', 'API Integration', 'Admin Panel'],
    estimatedDays: 10,
    complexity: 'complex',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Auth0'],
    isActive: true,
    popularity: 78
  },
  {
    id: 'enterprise-solution',
    name: 'Enterprise Solution',
    description: 'Custom enterprise-grade application',
    basePrice: 4999,
    features: ['Custom Architecture', 'Scalable Infrastructure', 'Advanced Security', 'Support'],
    estimatedDays: 30,
    complexity: 'enterprise',
    technologies: ['Microservices', 'Docker', 'Kubernetes', 'AWS'],
    isActive: true,
    popularity: 65
  }
]

const PayPalBuildIntegration: React.FC = () => {
  const [transactions, setTransactions] = useState<PayPalTransaction[]>([])
  const [buildRequests, setBuildRequests] = useState<BuildRequest[]>([])
  const [packages, setPackages] = useState<BuildPackage[]>(BUILD_PACKAGES)
  const [config, setConfig] = useState<PayPalConfig>({
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    webhookId: '',
    autoInvoicing: true,
    defaultCurrency: 'USD',
    taxRate: 8.5,
    paymentTerms: 30
  })
  const [selectedTransaction, setSelectedTransaction] = useState<PayPalTransaction | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<BuildRequest | null>(null)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [isCreatingPackage, setIsCreatingPackage] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    loadTransactionData()
    loadBuildRequests()
    loadPayPalConfig()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTransactionData = async () => {
    try {
      // Load PayPal transactions from database
      const paypalTransactions = await blink.db.paypalTransactions?.list() || []
      setTransactions(paypalTransactions)
    } catch (error) {
      console.error('Failed to load transaction data:', error)
      loadMockTransactions()
    }
  }

  const loadMockTransactions = () => {
    const mockTransactions: PayPalTransaction[] = [
      {
        id: '1',
        type: 'payment',
        status: 'completed',
        amount: 799.00,
        currency: 'USD',
        description: 'Business Website - TechCorp Landing Page',
        buildId: 'build_001',
        buildType: 'business-website',
        clientEmail: 'john@techcorp.com',
        clientName: 'John Smith',
        paypalTransactionId: 'PAYID-MXXX-XXXX-XXXX-XXXX',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        feeAmount: 23.97,
        netAmount: 775.03,
        metadata: {
          buildComplexity: 'medium',
          estimatedHours: 40,
          technologies: ['Next.js', 'Tailwind CSS', 'Strapi CMS'],
          features: ['Multi-page', 'CMS Integration', 'Blog', 'SEO'],
          clientRequirements: 'Modern design with dark theme, blog integration'
        }
      },
      {
        id: '2',
        type: 'payment',
        status: 'pending',
        amount: 1499.00,
        currency: 'USD',
        description: 'Web Application - E-commerce Platform',
        buildId: 'build_002',
        buildType: 'web-app',
        clientEmail: 'sarah@startup.io',
        clientName: 'Sarah Johnson',
        paypalTransactionId: 'PAYID-MYYY-YYYY-YYYY-YYYY',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        feeAmount: 44.97,
        netAmount: 1454.03,
        metadata: {
          buildComplexity: 'complex',
          estimatedHours: 80,
          technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
          features: ['User Authentication', 'Payment Processing', 'Admin Panel', 'Analytics'],
          clientRequirements: 'Full e-commerce with inventory management'
        }
      },
      {
        id: '3',
        type: 'refund',
        status: 'completed',
        amount: -299.00,
        currency: 'USD',
        description: 'Refund - Landing Page Project Cancellation',
        buildId: 'build_003',
        buildType: 'landing-page',
        clientEmail: 'mike@company.com',
        clientName: 'Mike Wilson',
        paypalTransactionId: 'PAYID-MZZZ-ZZZZ-ZZZZ-ZZZZ',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172800000).toISOString(),
        feeAmount: -8.97,
        netAmount: -290.03,
        metadata: {
          buildComplexity: 'simple',
          estimatedHours: 16,
          technologies: ['React', 'Tailwind CSS'],
          features: ['Responsive Design', 'Contact Form']
        }
      }
    ]
    setTransactions(mockTransactions)
  }

  const loadBuildRequests = () => {
    const mockRequests: BuildRequest[] = [
      {
        id: 'req_001',
        clientName: 'Alice Cooper',
        clientEmail: 'alice@musicstore.com',
        projectTitle: 'Music Store Website',
        description: 'E-commerce website for selling musical instruments',
        packageId: 'web-app',
        customizations: ['Custom audio player', 'Instrument configurator'],
        totalAmount: 1799.00,
        status: 'quote',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'req_002',
        clientName: 'Bob Restaurant',
        clientEmail: 'bob@restaurant.com',
        projectTitle: 'Restaurant Website',
        description: 'Modern restaurant website with online ordering',
        packageId: 'business-website',
        customizations: ['Online ordering system', 'Reservation system'],
        totalAmount: 1099.00,
        status: 'approved',
        paymentStatus: 'paid',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        dueDate: new Date(Date.now() + 432000000).toISOString(),
        paypalInvoiceId: 'INV2-XXXX-XXXX-XXXX',
        transactionId: '4'
      }
    ]
    setBuildRequests(mockRequests)
  }

  const loadPayPalConfig = async () => {
    try {
      // Load PayPal configuration from database
      const paypalConfig = await blink.db.paypalConfig?.list() || []
      if (paypalConfig.length > 0) {
        setConfig(paypalConfig[0])
      }
    } catch (error) {
      console.error('Failed to load PayPal config:', error)
    }
  }

  const createInvoice = async (requestId: string) => {
    const request = buildRequests.find(r => r.id === requestId)
    if (!request) return

    try {
      // In a real implementation, this would call PayPal API
      const invoiceId = `INV2-${Date.now()}`
      
      // Update request with invoice ID
      setBuildRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, paypalInvoiceId: invoiceId, status: 'approved' }
          : r
      ))
      
      // Create transaction record
      const newTransaction: PayPalTransaction = {
        id: `trans_${Date.now()}`,
        type: 'payment',
        status: 'pending',
        amount: request.totalAmount,
        currency: config.defaultCurrency,
        description: `${request.projectTitle} - ${request.clientName}`,
        buildId: request.id,
        buildType: request.packageId,
        clientEmail: request.clientEmail,
        clientName: request.clientName,
        paypalTransactionId: `PAYID-${Date.now()}`,
        createdAt: new Date().toISOString(),
        feeAmount: request.totalAmount * 0.03, // 3% PayPal fee
        netAmount: request.totalAmount * 0.97,
        metadata: {
          buildComplexity: packages.find(p => p.id === request.packageId)?.complexity || 'medium',
          estimatedHours: packages.find(p => p.id === request.packageId)?.estimatedDays ? packages.find(p => p.id === request.packageId)!.estimatedDays * 8 : 40,
          technologies: packages.find(p => p.id === request.packageId)?.technologies || [],
          features: packages.find(p => p.id === request.packageId)?.features || [],
          clientRequirements: request.description
        }
      }
      
      setTransactions(prev => [newTransaction, ...prev])
      
    } catch (error) {
      console.error('Failed to create invoice:', error)
    }
  }

  const processRefund = async (transactionId: string, amount: number, reason: string) => {
    try {
      // In a real implementation, this would call PayPal API
      const refundTransaction: PayPalTransaction = {
        id: `refund_${Date.now()}`,
        type: 'refund',
        status: 'completed',
        amount: -amount,
        currency: config.defaultCurrency,
        description: `Refund - ${reason}`,
        paypalTransactionId: `REFUND-${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        feeAmount: -amount * 0.03,
        netAmount: -amount * 0.97,
        metadata: {}
      }
      
      setTransactions(prev => [refundTransaction, ...prev])
      
    } catch (error) {
      console.error('Failed to process refund:', error)
    }
  }

  const getFilteredTransactions = () => {
    let filtered = transactions

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const calculateStats = () => {
    const now = new Date()
    const startDate = startOfMonth(now)
    const endDate = endOfMonth(now)
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= startDate && transactionDate <= endDate
    })
    
    const totalRevenue = monthlyTransactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.netAmount, 0)
    
    const totalRefunds = monthlyTransactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const pendingPayments = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const completedBuilds = buildRequests.filter(r => r.status === 'completed').length
    const activeBuilds = buildRequests.filter(r => r.status === 'in-progress').length
    
    return {
      totalRevenue,
      totalRefunds,
      pendingPayments,
      completedBuilds,
      activeBuilds,
      transactionCount: monthlyTransactions.length
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="h-4 w-4" />
      case 'refund': return <RefreshCw className="h-4 w-4" />
      case 'subscription': return <Calendar className="h-4 w-4" />
      case 'payout': return <Upload className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const filteredTransactions = getFilteredTransactions()
  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-yellow-600">${stats.pendingPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Refunds</p>
                <p className="text-lg font-bold text-red-600">${stats.totalRefunds.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <p className="text-lg font-bold">{stats.completedBuilds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active</p>
                <p className="text-lg font-bold">{stats.activeBuilds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{stats.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsConfiguring(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button onClick={() => setIsCreatingPackage(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Package
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="requests">Build Requests</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest PayPal transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {filteredTransactions.slice(0, 5).map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getStatusColor(transaction.status)}`}>
                            {getTypeIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.clientName} • {format(parseISO(transaction.createdAt), 'MMM dd')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Build Packages Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Package Performance</CardTitle>
                <CardDescription>Most popular build packages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.sort((a, b) => b.popularity - a.popularity).map(pkg => (
                    <div key={pkg.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{pkg.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${pkg.basePrice} • {pkg.popularity}% popularity
                        </span>
                      </div>
                      <Progress value={pkg.popularity} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="space-y-3">
            {filteredTransactions.map(transaction => (
              <Card 
                key={transaction.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${getStatusColor(transaction.status)}`}>
                        {getTypeIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{transaction.description}</h4>
                          <Badge variant="outline" className="text-xs">
                            {transaction.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{transaction.clientName}</span>
                          <span>•</span>
                          <span>{format(parseISO(transaction.createdAt), 'MMM dd, yyyy')}</span>
                          <span>•</span>
                          <span>ID: {transaction.paypalTransactionId}</span>
                        </div>
                        
                        {transaction.metadata.technologies && (
                          <div className="flex items-center space-x-1 mt-2">
                            {transaction.metadata.technologies.slice(0, 3).map(tech => (
                              <Badge key={tech} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Net: ${transaction.netAmount.toLocaleString()}
                      </p>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className={`${getStatusColor(transaction.status)} text-white`}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="space-y-3">
            {buildRequests.map(request => {
              const pkg = packages.find(p => p.id === request.packageId)
              
              return (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{request.projectTitle}</h4>
                          <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                          <Badge variant={request.paymentStatus === 'paid' ? 'default' : 'outline'}>
                            {request.paymentStatus}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Client:</strong> {request.clientName} ({request.clientEmail})</p>
                          <p><strong>Package:</strong> {pkg?.name}</p>
                          <p><strong>Description:</strong> {request.description}</p>
                          {request.customizations.length > 0 && (
                            <p><strong>Customizations:</strong> {request.customizations.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold">${request.totalAmount.toLocaleString()}</p>
                        
                        <div className="flex space-x-2">
                          {request.status === 'quote' && (
                            <Button size="sm" onClick={() => createInvoice(request.id)}>
                              Create Invoice
                            </Button>
                          )}
                          {request.paymentStatus === 'paid' && (
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Build
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <Card key={pkg.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{pkg.name}</h4>
                    <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span className="font-medium">${pkg.basePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Days:</span>
                      <span className="font-medium">{pkg.estimatedDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complexity:</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {pkg.complexity}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Popularity:</span>
                      <span className="font-medium">{pkg.popularity}%</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.features.map(feature => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <p className="text-sm font-medium">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.technologies.map(tech => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.map(pkg => {
                    const packageRevenue = transactions
                      .filter(t => t.buildType === pkg.id && t.status === 'completed')
                      .reduce((sum, t) => sum + t.netAmount, 0)
                    const totalRevenue = transactions
                      .filter(t => t.status === 'completed')
                      .reduce((sum, t) => sum + t.netAmount, 0)
                    const percentage = totalRevenue > 0 ? (packageRevenue / totalRevenue) * 100 : 0
                    
                    return (
                      <div key={pkg.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{pkg.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ${packageRevenue.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['completed', 'pending', 'failed', 'cancelled'].map(status => {
                    const count = transactions.filter(t => t.status === status).length
                    const percentage = transactions.length > 0 ? (count / transactions.length) * 100 : 0
                    
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{status}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getTypeIcon(selectedTransaction.type)}
                <span>{selectedTransaction.description}</span>
              </DialogTitle>
              <DialogDescription>
                Transaction ID: {selectedTransaction.paypalTransactionId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <p className="font-bold text-lg">${selectedTransaction.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Net Amount</Label>
                  <p className="font-bold text-lg">${selectedTransaction.netAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Fee</Label>
                  <p className="text-sm">${selectedTransaction.feeAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={`${getStatusColor(selectedTransaction.status)} text-white`}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>
              
              {selectedTransaction.clientName && (
                <div>
                  <Label>Client Information</Label>
                  <p className="text-sm">
                    {selectedTransaction.clientName} ({selectedTransaction.clientEmail})
                  </p>
                </div>
              )}
              
              {selectedTransaction.metadata.technologies && (
                <div>
                  <Label>Technologies</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTransaction.metadata.technologies.map(tech => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedTransaction.metadata.features && (
                <div>
                  <Label>Features</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTransaction.metadata.features.map(feature => (
                      <Badge key={feature} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                {selectedTransaction.status === 'completed' && selectedTransaction.type === 'payment' && (
                  <Button 
                    variant="outline" 
                    onClick={() => processRefund(selectedTransaction.id, selectedTransaction.amount, 'Client request')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                )}
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in PayPal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Configuration Dialog */}
      <Dialog open={isConfiguring} onOpenChange={setIsConfiguring}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PayPal Configuration</DialogTitle>
            <DialogDescription>Configure your PayPal integration settings</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <Input 
                  id="client-id"
                  value={config.clientId}
                  onChange={(e) => setConfig({...config, clientId: e.target.value})}
                  placeholder="PayPal Client ID"
                />
              </div>
              <div>
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input 
                  id="client-secret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                  placeholder="PayPal Client Secret"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={config.environment} onValueChange={(value: any) => setConfig({...config, environment: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Default Currency</Label>
                <Select value={config.defaultCurrency} onValueChange={(value) => setConfig({...config, defaultCurrency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input 
                  id="tax-rate"
                  type="number"
                  step="0.1"
                  value={config.taxRate}
                  onChange={(e) => setConfig({...config, taxRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="payment-terms">Payment Terms (days)</Label>
                <Input 
                  id="payment-terms"
                  type="number"
                  value={config.paymentTerms}
                  onChange={(e) => setConfig({...config, paymentTerms: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={config.autoInvoicing}
                onCheckedChange={(checked) => setConfig({...config, autoInvoicing: checked})}
              />
              <Label>Enable automatic invoicing</Label>
            </div>
            
            <div>
              <Label htmlFor="webhook-id">Webhook ID</Label>
              <Input 
                id="webhook-id"
                value={config.webhookId}
                onChange={(e) => setConfig({...config, webhookId: e.target.value})}
                placeholder="PayPal Webhook ID"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                Cancel
              </Button>
              <Button>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PayPalBuildIntegration