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
  Mail, Star, Archive, Trash2, Search, Filter, Tag,
  DollarSign, Percent, Gift, AlertCircle, Clock,
  TrendingUp, BarChart3, Eye, ExternalLink, Download,
  Plus, Settings, RefreshCw, Bell, Calendar,
  ShoppingCart, CreditCard, Zap, Target, Users
} from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface EmailRecord {
  id: string
  subject: string
  sender: string
  senderDomain: string
  receivedAt: string
  category: EmailCategory
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'unread' | 'read' | 'starred' | 'archived' | 'deleted'
  tags: string[]
  content: string
  attachments: string[]
  dealInfo?: {
    discount: number
    originalPrice?: number
    salePrice?: number
    expiryDate?: string
    couponCode?: string
    category: string
  }
  buildUsage?: {
    service: string
    usage: number
    cost: number
    billingPeriod: string
    nextBilling?: string
  }
  isImportant: boolean
  aiSummary?: string
  actionRequired: boolean
  reminderSet?: string
}

type EmailCategory = 
  | 'deals-promos' 
  | 'build-usage' 
  | 'important' 
  | 'newsletters' 
  | 'receipts' 
  | 'notifications' 
  | 'spam' 
  | 'other'

interface EmailFilter {
  id: string
  name: string
  conditions: {
    sender?: string
    subject?: string
    content?: string
    domain?: string
  }
  actions: {
    category?: EmailCategory
    priority?: string
    tags?: string[]
    autoArchive?: boolean
    markImportant?: boolean
  }
  isActive: boolean
}

interface DealAlert {
  id: string
  keywords: string[]
  minDiscount: number
  categories: string[]
  isActive: boolean
  lastTriggered?: string
}

const EMAIL_CATEGORIES = [
  { id: 'deals-promos', name: 'Deals & Promos', icon: Gift, color: 'bg-green-500' },
  { id: 'build-usage', name: 'Build Usage', icon: Zap, color: 'bg-blue-500' },
  { id: 'important', name: 'Important', icon: AlertCircle, color: 'bg-red-500' },
  { id: 'newsletters', name: 'Newsletters', icon: Mail, color: 'bg-purple-500' },
  { id: 'receipts', name: 'Receipts', icon: CreditCard, color: 'bg-yellow-500' },
  { id: 'notifications', name: 'Notifications', icon: Bell, color: 'bg-indigo-500' },
  { id: 'spam', name: 'Spam', icon: Trash2, color: 'bg-gray-500' },
  { id: 'other', name: 'Other', icon: Archive, color: 'bg-gray-400' }
]

const EmailTrackerSystem: React.FC = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [filters, setFilters] = useState<EmailFilter[]>([])
  const [dealAlerts, setDealAlerts] = useState<DealAlert[]>([])
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('inbox')
  const [isAddingFilter, setIsAddingFilter] = useState(false)
  const [isAddingAlert, setIsAddingAlert] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'sender'>('date')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')

  useEffect(() => {
    loadEmailData()
    loadFilters()
    loadDealAlerts()
    // Set up real-time email monitoring
    setupEmailMonitoring()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmailData = async () => {
    try {
      // Load emails from database
      const emailRecords = await blink.db.emailRecords?.list() || []
      setEmails(emailRecords)
    } catch (error) {
      console.error('Failed to load email data:', error)
      loadMockEmails()
    }
  }

  const loadMockEmails = () => {
    const mockEmails: EmailRecord[] = [
      {
        id: '1',
        subject: '🔥 50% OFF Everything - Limited Time!',
        sender: 'deals@techstore.com',
        senderDomain: 'techstore.com',
        receivedAt: new Date().toISOString(),
        category: 'deals-promos',
        priority: 'high',
        status: 'unread',
        tags: ['discount', 'tech', 'limited-time'],
        content: 'Huge sale on all tech products. Use code SAVE50 for 50% off everything!',
        attachments: [],
        dealInfo: {
          discount: 50,
          expiryDate: '2024-02-01',
          couponCode: 'SAVE50',
          category: 'Electronics'
        },
        isImportant: true,
        aiSummary: 'Major tech sale with 50% discount, expires soon',
        actionRequired: true
      },
      {
        id: '2',
        subject: 'Your OpenAI API Usage Report - January 2024',
        sender: 'billing@openai.com',
        senderDomain: 'openai.com',
        receivedAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'build-usage',
        priority: 'medium',
        status: 'read',
        tags: ['api', 'billing', 'usage'],
        content: 'Your API usage for January: $127.50. Next billing date: February 1st.',
        attachments: ['usage-report.pdf'],
        buildUsage: {
          service: 'OpenAI API',
          usage: 1275000,
          cost: 127.50,
          billingPeriod: 'monthly',
          nextBilling: '2024-02-01'
        },
        isImportant: true,
        aiSummary: 'Monthly API usage bill for $127.50, next billing Feb 1st',
        actionRequired: false
      },
      {
        id: '3',
        subject: 'Amazon Web Services - Billing Alert',
        sender: 'aws-billing@amazon.com',
        senderDomain: 'amazon.com',
        receivedAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'build-usage',
        priority: 'high',
        status: 'starred',
        tags: ['aws', 'billing', 'alert'],
        content: 'Your AWS usage has exceeded $200 this month. Current bill: $234.67',
        attachments: [],
        buildUsage: {
          service: 'AWS',
          usage: 0,
          cost: 234.67,
          billingPeriod: 'monthly',
          nextBilling: '2024-02-01'
        },
        isImportant: true,
        aiSummary: 'AWS billing alert - exceeded budget, current bill $234.67',
        actionRequired: true
      },
      {
        id: '4',
        subject: 'Black Friday Mega Sale - Up to 80% Off!',
        sender: 'sales@designtools.com',
        senderDomain: 'designtools.com',
        receivedAt: new Date(Date.now() - 259200000).toISOString(),
        category: 'deals-promos',
        priority: 'medium',
        status: 'read',
        tags: ['black-friday', 'design', 'tools'],
        content: 'Massive Black Friday sale on design tools and templates.',
        attachments: [],
        dealInfo: {
          discount: 80,
          expiryDate: '2024-01-30',
          couponCode: 'BLACKFRIDAY80',
          category: 'Design Tools'
        },
        isImportant: false,
        aiSummary: 'Black Friday sale on design tools, up to 80% off',
        actionRequired: false
      },
      {
        id: '5',
        subject: 'Important: Security Update Required',
        sender: 'security@github.com',
        senderDomain: 'github.com',
        receivedAt: new Date(Date.now() - 345600000).toISOString(),
        category: 'important',
        priority: 'urgent',
        status: 'unread',
        tags: ['security', 'update', 'github'],
        content: 'Critical security update required for your repositories.',
        attachments: [],
        isImportant: true,
        aiSummary: 'Critical security update needed for GitHub repositories',
        actionRequired: true,
        reminderSet: new Date(Date.now() + 3600000).toISOString()
      }
    ]
    setEmails(mockEmails)
  }

  const loadFilters = () => {
    const mockFilters: EmailFilter[] = [
      {
        id: '1',
        name: 'Deal Alerts',
        conditions: {
          subject: 'sale|discount|off|deal|promo',
          content: '%|discount|save|offer'
        },
        actions: {
          category: 'deals-promos',
          priority: 'high',
          tags: ['deal'],
          markImportant: true
        },
        isActive: true
      },
      {
        id: '2',
        name: 'Build Usage Tracking',
        conditions: {
          domain: 'openai.com|aws.amazon.com|vercel.com|netlify.com',
          subject: 'billing|usage|invoice'
        },
        actions: {
          category: 'build-usage',
          priority: 'medium',
          tags: ['billing', 'usage'],
          markImportant: true
        },
        isActive: true
      }
    ]
    setFilters(mockFilters)
  }

  const loadDealAlerts = () => {
    const mockAlerts: DealAlert[] = [
      {
        id: '1',
        keywords: ['design', 'template', 'ui', 'graphics'],
        minDiscount: 30,
        categories: ['Design Tools', 'Templates'],
        isActive: true
      },
      {
        id: '2',
        keywords: ['hosting', 'domain', 'server', 'cloud'],
        minDiscount: 20,
        categories: ['Web Services', 'Hosting'],
        isActive: true
      }
    ]
    setDealAlerts(mockAlerts)
  }

  const setupEmailMonitoring = () => {
    // Simulate real-time email monitoring
    const interval = setInterval(() => {
      // In a real implementation, this would connect to email APIs
      // For demo, we'll occasionally add new mock emails
      if (Math.random() < 0.1) { // 10% chance every interval
        addMockEmail()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }

  const addMockEmail = () => {
    const mockSubjects = [
      'New Deal Alert: 40% Off Premium Tools',
      'Your Stripe Usage Summary',
      'Important: Account Security Notice',
      'Weekly Newsletter - Tech Updates'
    ]
    
    const newEmail: EmailRecord = {
      id: `email_${Date.now()}`,
      subject: mockSubjects[Math.floor(Math.random() * mockSubjects.length)],
      sender: 'system@example.com',
      senderDomain: 'example.com',
      receivedAt: new Date().toISOString(),
      category: 'other',
      priority: 'medium',
      status: 'unread',
      tags: [],
      content: 'New email content...',
      attachments: [],
      isImportant: false,
      actionRequired: false
    }
    
    setEmails(prev => [newEmail, ...prev])
  }

  const markAsRead = async (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, status: 'read' } : email
    ))
  }

  const toggleStar = async (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId 
        ? { ...email, status: email.status === 'starred' ? 'read' : 'starred' }
        : email
    ))
  }

  const archiveEmail = async (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, status: 'archived' } : email
    ))
  }

  const deleteEmail = async (emailId: string) => {
    setEmails(prev => prev.filter(email => email.id !== emailId))
  }

  const addTag = async (emailId: string, tag: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId 
        ? { ...email, tags: [...email.tags, tag] }
        : email
    ))
  }

  const getFilteredEmails = () => {
    let filtered = emails

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(email => email.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(email => email.category === categoryFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(email => email.priority === priorityFilter)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(email => 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply sorting
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        case 'priority':
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'sender':
          return a.sender.localeCompare(b.sender)
        default:
          return 0
      }
    })

    return filtered
  }

  const getEmailStats = () => {
    const total = emails.length
    const unread = emails.filter(e => e.status === 'unread').length
    const important = emails.filter(e => e.isImportant).length
    const actionRequired = emails.filter(e => e.actionRequired).length
    const deals = emails.filter(e => e.category === 'deals-promos').length
    const buildUsage = emails.filter(e => e.category === 'build-usage').length
    
    return { total, unread, important, actionRequired, deals, buildUsage }
  }

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: EmailCategory) => {
    const cat = EMAIL_CATEGORIES.find(c => c.id === category)
    return cat ? cat.icon : Mail
  }

  const filteredEmails = getFilteredEmails()
  const stats = getEmailStats()

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Unread</p>
                <p className="text-lg font-bold">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Important</p>
                <p className="text-lg font-bold">{stats.important}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Action</p>
                <p className="text-lg font-bold">{stats.actionRequired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Deals</p>
                <p className="text-lg font-bold">{stats.deals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Usage</p>
                <p className="text-lg font-bold">{stats.buildUsage}</p>
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
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EMAIL_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="sender">Sender</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => setIsAddingFilter(true)}>
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setIsAddingAlert(true)}>
            <Bell className="h-4 w-4 mr-1" />
            Alerts
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="usage">Build Usage</TabsTrigger>
          <TabsTrigger value="important">Important</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <div className="space-y-2">
            {filteredEmails.map(email => {
              const CategoryIcon = getCategoryIcon(email.category)
              
              return (
                <Card 
                  key={email.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    email.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedEmail(email)
                    if (email.status === 'unread') markAsRead(email.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${EMAIL_CATEGORIES.find(c => c.id === email.category)?.color || 'bg-gray-500'}`}>
                          <CategoryIcon className="h-4 w-4 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className={`font-medium truncate ${
                              email.status === 'unread' ? 'font-bold' : ''
                            }`}>
                              {email.subject}
                            </p>
                            {email.isImportant && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {email.actionRequired && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{email.sender}</span>
                            <span>•</span>
                            <span>{formatDate(email.receivedAt)}</span>
                            {email.dealInfo && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">
                                  {email.dealInfo.discount}% OFF
                                </Badge>
                              </>
                            )}
                            {email.buildUsage && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  ${email.buildUsage.cost}
                                </Badge>
                              </>
                            )}
                          </div>
                          
                          {email.aiSummary && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {email.aiSummary}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-1 mt-2">
                            {email.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(email.priority)}`} />
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStar(email.id)
                          }}
                        >
                          <Star className={`h-4 w-4 ${
                            email.status === 'starred' ? 'text-yellow-500 fill-current' : ''
                          }`} />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation()
                            archiveEmail(email.id)
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emails.filter(e => e.category === 'deals-promos' && e.dealInfo).map(email => (
              <Card key={email.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {email.dealInfo!.discount}% OFF
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(email.receivedAt)}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold mb-2 line-clamp-2">{email.subject}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{email.sender}</p>
                  
                  {email.dealInfo!.expiryDate && (
                    <div className="flex items-center space-x-1 text-xs text-red-600 mb-3">
                      <Clock className="h-3 w-3" />
                      <span>Expires {format(parseISO(email.dealInfo!.expiryDate), 'MMM dd')}</span>
                    </div>
                  )}
                  
                  {email.dealInfo!.couponCode && (
                    <div className="bg-gray-100 p-2 rounded text-center mb-3">
                      <span className="text-sm font-mono font-bold">{email.dealInfo!.couponCode}</span>
                    </div>
                  )}
                  
                  <Button size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Deal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="space-y-4">
            {emails.filter(e => e.category === 'build-usage' && e.buildUsage).map(email => (
              <Card key={email.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-6 w-6 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">{email.buildUsage!.service}</h4>
                        <p className="text-sm text-muted-foreground">{email.sender}</p>
                      </div>
                    </div>
                    <Badge variant={email.buildUsage!.cost > 100 ? 'destructive' : 'secondary'}>
                      ${email.buildUsage!.cost}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Usage</p>
                      <p className="font-medium">{email.buildUsage!.usage.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost</p>
                      <p className="font-medium">${email.buildUsage!.cost}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Period</p>
                      <p className="font-medium capitalize">{email.buildUsage!.billingPeriod}</p>
                    </div>
                    {email.buildUsage!.nextBilling && (
                      <div>
                        <p className="text-muted-foreground">Next Billing</p>
                        <p className="font-medium">{format(parseISO(email.buildUsage!.nextBilling), 'MMM dd')}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="important" className="space-y-4">
          <div className="space-y-3">
            {emails.filter(e => e.isImportant || e.actionRequired).map(email => {
              const CategoryIcon = getCategoryIcon(email.category)
              
              return (
                <Card key={email.id} className="border-l-4 border-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <CategoryIcon className="h-5 w-5 text-red-500" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{email.subject}</h4>
                            {email.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {email.sender} • {formatDate(email.receivedAt)}
                          </p>
                          {email.aiSummary && (
                            <p className="text-sm">{email.aiSummary}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {email.reminderSet && (
                          <Badge variant="outline" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Reminder Set
                          </Badge>
                        )}
                        <Button size="sm">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {EMAIL_CATEGORIES.map(category => {
                    const count = emails.filter(e => e.category === category.id).length
                    const percentage = emails.length > 0 ? (count / emails.length) * 100 : 0
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${category.color}`} />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{count}</span>
                          <span className="text-xs text-muted-foreground ml-1">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Deal Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emails.filter(e => e.dealInfo).map(email => (
                    <div key={email.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{email.dealInfo!.category}</p>
                        <p className="text-xs text-muted-foreground">{email.dealInfo!.discount}% discount</p>
                      </div>
                      <Badge variant="secondary">
                        Save ${((email.dealInfo!.originalPrice || 100) * email.dealInfo!.discount / 100).toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Detail Dialog */}
      {selectedEmail && (
        <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedEmail.subject}</span>
                {selectedEmail.isImportant && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
              </DialogTitle>
              <DialogDescription>
                From: {selectedEmail.sender} • {format(parseISO(selectedEmail.receivedAt), 'PPpp')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{selectedEmail.category}</Badge>
                <Badge variant="outline" className={getPriorityColor(selectedEmail.priority)}>
                  {selectedEmail.priority}
                </Badge>
                {selectedEmail.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              
              {selectedEmail.aiSummary && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">AI Summary</h4>
                  <p className="text-sm">{selectedEmail.aiSummary}</p>
                </div>
              )}
              
              {selectedEmail.dealInfo && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Deal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Discount: {selectedEmail.dealInfo.discount}%</p>
                      {selectedEmail.dealInfo.couponCode && (
                        <p className="font-medium">Code: {selectedEmail.dealInfo.couponCode}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Category: {selectedEmail.dealInfo.category}</p>
                      {selectedEmail.dealInfo.expiryDate && (
                        <p className="font-medium">Expires: {format(parseISO(selectedEmail.dealInfo.expiryDate), 'PPP')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedEmail.buildUsage && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Build Usage Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Service: {selectedEmail.buildUsage.service}</p>
                      <p className="font-medium">Usage: {selectedEmail.buildUsage.usage.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cost: ${selectedEmail.buildUsage.cost}</p>
                      <p className="font-medium">Period: {selectedEmail.buildUsage.billingPeriod}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedEmail.content}</p>
                </div>
              </div>
              
              {selectedEmail.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                        <Download className="h-4 w-4" />
                        <span className="text-sm">{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => toggleStar(selectedEmail.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {selectedEmail.status === 'starred' ? 'Unstar' : 'Star'}
                </Button>
                <Button variant="outline" onClick={() => archiveEmail(selectedEmail.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button variant="destructive" onClick={() => deleteEmail(selectedEmail.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default EmailTrackerSystem