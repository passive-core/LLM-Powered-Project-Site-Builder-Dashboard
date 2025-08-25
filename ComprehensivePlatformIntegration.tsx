import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Switch } from './ui/switch'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import {
  ShoppingCart, DollarSign, TrendingUp, Users, Package, 
  Camera, Palette, Shirt, Book, Coffee, Gamepad2,
  Facebook, Instagram, Twitter, Youtube,
  Globe, Zap, Target, BarChart3, Settings,
  CheckCircle, AlertCircle, Clock, Play, Pause
} from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface Platform {
  id: string
  name: string
  category: string
  icon: React.ComponentType<any>
  description: string
  status: 'connected' | 'disconnected' | 'pending' | 'error'
  revenue: number
  monthlyGrowth: number
  automationLevel: 'manual' | 'semi-auto' | 'full-auto'
  features: string[]
  apiEndpoint?: string
  lastSync?: string
  metrics: {
    clicks: number
    conversions: number
    earnings: number
    roi: number
  }
}

interface AutomationRule {
  id: string
  name: string
  platform: string
  trigger: string
  action: string
  conditions: string[]
  isActive: boolean
  lastRun?: string
  successRate: number
}

const PLATFORMS: Platform[] = [
  // E-commerce & Affiliates
  {
    id: 'amazon-associates',
    name: 'Amazon Associates',
    category: 'Affiliate Marketing',
    icon: ShoppingCart,
    description: 'Earn commissions from Amazon product recommendations',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Product Links', 'Native Shopping Ads', 'OneLink', 'Associates SiteStripe'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'amazon-kdp',
    name: 'Amazon KDP',
    category: 'Print on Demand',
    icon: Book,
    description: 'Self-publish books and earn royalties',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Book Publishing', 'Cover Creator', 'Royalty Tracking', 'Marketing Tools'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'pinterest-creator',
    name: 'Pinterest Creator',
    category: 'Social Commerce',
    icon: Camera,
    description: 'Monetize your Pinterest content and drive traffic',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Creator Fund', 'Shopping Features', 'Idea Pins', 'Analytics'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'etsy-shop',
    name: 'Etsy Shop',
    category: 'Print on Demand',
    icon: Palette,
    description: 'Sell handmade and digital products',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Digital Downloads', 'Print on Demand', 'Shop Analytics', 'Advertising'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'redbubble',
    name: 'Redbubble',
    category: 'Print on Demand',
    icon: Shirt,
    description: 'Sell your designs on various products',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['T-shirts', 'Stickers', 'Phone Cases', 'Home Decor'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'teespring',
    name: 'Spring (Teespring)',
    category: 'Print on Demand',
    icon: Shirt,
    description: 'Create and sell custom merchandise',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Custom Apparel', 'Home & Living', 'Accessories', 'Creator Tools'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'shopify-affiliate',
    name: 'Shopify Affiliate',
    category: 'Affiliate Marketing',
    icon: ShoppingCart,
    description: 'Earn commissions by referring new merchants',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Referral Program', 'Commission Tracking', 'Marketing Materials', 'Analytics'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'clickbank',
    name: 'ClickBank',
    category: 'Affiliate Marketing',
    icon: DollarSign,
    description: 'Promote digital products and earn high commissions',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Digital Products', 'High Commissions', 'Analytics', 'Payment Processing'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'cj-affiliate',
    name: 'CJ Affiliate',
    category: 'Affiliate Marketing',
    icon: Globe,
    description: 'Access thousands of advertiser programs',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Brand Partnerships', 'Deep Linking', 'Real-time Reporting', 'Mobile Tracking'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'impact-radius',
    name: 'Impact Radius',
    category: 'Affiliate Marketing',
    icon: Target,
    description: 'Partnership automation and tracking platform',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Partnership Management', 'Fraud Protection', 'Attribution', 'Automation'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  // Content & Creator Platforms
  {
    id: 'youtube-partner',
    name: 'YouTube Partner',
    category: 'Content Monetization',
    icon: Youtube,
    description: 'Monetize your YouTube content',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Ad Revenue', 'Channel Memberships', 'Super Chat', 'YouTube Shorts Fund'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'twitch-affiliate',
    name: 'Twitch Affiliate',
    category: 'Content Monetization',
    icon: Gamepad2,
    description: 'Earn from live streaming',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Subscriptions', 'Bits', 'Ad Revenue', 'Game Sales'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'patreon',
    name: 'Patreon',
    category: 'Content Monetization',
    icon: Coffee,
    description: 'Subscription-based creator platform',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Monthly Subscriptions', 'Exclusive Content', 'Community Building', 'Analytics'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  // Additional Platforms
  {
    id: 'gumroad',
    name: 'Gumroad',
    category: 'Digital Products',
    icon: Package,
    description: 'Sell digital products directly to customers',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Digital Downloads', 'Subscription Products', 'Discount Codes', 'Analytics'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  },
  {
    id: 'teachable',
    name: 'Teachable',
    category: 'Online Education',
    icon: Book,
    description: 'Create and sell online courses',
    status: 'disconnected',
    revenue: 0,
    monthlyGrowth: 0,
    automationLevel: 'manual',
    features: ['Course Creation', 'Student Management', 'Certificates', 'Marketing Tools'],
    metrics: { clicks: 0, conversions: 0, earnings: 0, roi: 0 }
  }
]

const ComprehensivePlatformIntegration: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>(PLATFORMS)
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadPlatformData()
    loadAutomationRules()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPlatformData = async () => {
    try {
      // Load platform connections from database
      const connections = await blink.db.toolIntegrations.list({
        where: { toolType: 'platform' }
      })
      
      // Update platform statuses based on database
      const updatedPlatforms = platforms.map(platform => {
        const connection = connections.find(c => c.toolName === platform.id)
        if (connection) {
          return {
            ...platform,
            status: connection.isActive ? 'connected' : 'disconnected',
            lastSync: connection.updatedAt
          }
        }
        return platform
      })
      
      setPlatforms(updatedPlatforms)
      setTotalRevenue(updatedPlatforms.reduce((sum, p) => sum + p.revenue, 0))
    } catch (error) {
      console.error('Failed to load platform data:', error)
    }
  }

  const loadAutomationRules = async () => {
    // Load automation rules from database
    const rules: AutomationRule[] = [
      {
        id: '1',
        name: 'Auto-post to Pinterest',
        platform: 'pinterest-creator',
        trigger: 'New blog post published',
        action: 'Create Pinterest pin with AI-generated image',
        conditions: ['Post has featured image', 'Post category is lifestyle'],
        isActive: true,
        lastRun: '2024-01-20T10:30:00Z',
        successRate: 95
      },
      {
        id: '2',
        name: 'Amazon product recommendations',
        platform: 'amazon-associates',
        trigger: 'User views product category',
        action: 'Display relevant Amazon products',
        conditions: ['User is logged in', 'Category has affiliate products'],
        isActive: false,
        successRate: 87
      }
    ]
    setAutomationRules(rules)
  }

  const connectPlatform = async (platformId: string) => {
    setIsConnecting(platformId)
    
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Save connection to database
      await blink.db.toolIntegrations.create({
        id: `integration_${platformId}_${Date.now()}`,
        toolName: platformId,
        toolType: 'platform',
        apiEndpoint: `https://api.${platformId}.com`,
        authToken: 'mock_token_' + Math.random().toString(36).substr(2, 9),
        config: JSON.stringify({ 
          autoSync: true, 
          webhookUrl: `https://your-app.com/webhooks/${platformId}` 
        }),
        isActive: 1
      })
      
      // Update platform status
      setPlatforms(prev => prev.map(p => 
        p.id === platformId 
          ? { ...p, status: 'connected', lastSync: new Date().toISOString() }
          : p
      ))
      
    } catch (error) {
      console.error('Failed to connect platform:', error)
      setPlatforms(prev => prev.map(p => 
        p.id === platformId ? { ...p, status: 'error' } : p
      ))
    } finally {
      setIsConnecting(null)
    }
  }

  const disconnectPlatform = async (platformId: string) => {
    try {
      // Remove from database
      const connections = await blink.db.toolIntegrations.list({
        where: { toolName: platformId }
      })
      
      for (const connection of connections) {
        await blink.db.toolIntegrations.delete(connection.id)
      }
      
      // Update platform status
      setPlatforms(prev => prev.map(p => 
        p.id === platformId ? { ...p, status: 'disconnected', lastSync: undefined } : p
      ))
      
    } catch (error) {
      console.error('Failed to disconnect platform:', error)
    }
  }

  const toggleAutomationRule = async (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const getStatusColor = (status: Platform['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: Platform['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const filteredPlatforms = platforms.filter(platform => {
    const matchesSearch = platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         platform.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || platform.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(platforms.map(p => p.category))]
  const connectedCount = platforms.filter(p => p.status === 'connected').length
  const totalEarnings = platforms.reduce((sum, p) => sum + p.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Platforms</p>
                <p className="text-2xl font-bold">{platforms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Automation Rules</p>
                <p className="text-2xl font-bold">{automationRules.filter(r => r.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly earnings across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platforms.filter(p => p.revenue > 0).map(platform => (
                    <div key={platform.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <platform.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{platform.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${platform.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {platform.monthlyGrowth > 0 ? '+' : ''}{platform.monthlyGrowth}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common platform management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Create New Automation Rule
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Revenue Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Bulk Platform Settings
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Optimize Campaigns
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search platforms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlatforms.map(platform => (
              <Card key={platform.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <platform.icon className="h-6 w-6" />
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                    </div>
                    <Badge 
                      variant={platform.status === 'connected' ? 'default' : 'secondary'}
                      className={`${getStatusColor(platform.status)} text-white`}
                    >
                      {getStatusIcon(platform.status)}
                      <span className="ml-1 capitalize">{platform.status}</span>
                    </Badge>
                  </div>
                  <CardDescription>{platform.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <Badge variant="outline">{platform.category}</Badge>
                  </div>
                  
                  {platform.status === 'connected' && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Revenue</p>
                        <p className="text-green-600">${platform.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Growth</p>
                        <p className={platform.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {platform.monthlyGrowth > 0 ? '+' : ''}{platform.monthlyGrowth}%
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    {platform.status === 'connected' ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedPlatform(platform)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => disconnectPlatform(platform.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => connectPlatform(platform.id)}
                        disabled={isConnecting === platform.id}
                        className="flex-1"
                      >
                        {isConnecting === platform.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Automation Rules</h3>
              <p className="text-sm text-muted-foreground">Automate your platform management</p>
            </div>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>

          <div className="space-y-4">
            {automationRules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Platform:</strong> {platforms.find(p => p.id === rule.platform)?.name}</p>
                        <p><strong>Trigger:</strong> {rule.trigger}</p>
                        <p><strong>Action:</strong> {rule.action}</p>
                        <p><strong>Success Rate:</strong> {rule.successRate}%</p>
                        {rule.lastRun && (
                          <p><strong>Last Run:</strong> {new Date(rule.lastRun).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={rule.isActive}
                        onCheckedChange={() => toggleAutomationRule(rule.id)}
                      />
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
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
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platforms.filter(p => p.status === 'connected').map(platform => (
                    <div key={platform.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{platform.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ROI: {platform.metrics.roi}%
                        </span>
                      </div>
                      <Progress value={platform.metrics.roi} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => {
                    const categoryPlatforms = platforms.filter(p => p.category === category)
                    const categoryRevenue = categoryPlatforms.reduce((sum, p) => sum + p.revenue, 0)
                    const percentage = totalEarnings > 0 ? (categoryRevenue / totalEarnings) * 100 : 0
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-muted-foreground">
                            ${categoryRevenue.toLocaleString()} ({percentage.toFixed(1)}%)
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

      {/* Platform Configuration Dialog */}
      {selectedPlatform && (
        <Dialog open={!!selectedPlatform} onOpenChange={() => setSelectedPlatform(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <selectedPlatform.icon className="h-6 w-6" />
                <span>{selectedPlatform.name} Configuration</span>
              </DialogTitle>
              <DialogDescription>
                Configure settings and automation for {selectedPlatform.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input id="api-key" placeholder="Enter API key" type="password" />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="automation-level">Automation Level</Label>
                <Select defaultValue={selectedPlatform.automationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="semi-auto">Semi-Automatic</SelectItem>
                    <SelectItem value="full-auto">Fully Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="custom-config">Custom Configuration</Label>
                <Textarea 
                  id="custom-config" 
                  placeholder="Enter JSON configuration..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedPlatform(null)}>
                  Cancel
                </Button>
                <Button>
                  Save Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ComprehensivePlatformIntegration