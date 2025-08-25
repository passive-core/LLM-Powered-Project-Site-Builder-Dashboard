import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { ScrollArea } from './ui/scroll-area'
import { useToast } from '../hooks/use-toast'
import { 
  Zap, Activity, Database, Globe, Shield, AlertTriangle, 
  CheckCircle, Clock, TrendingUp, Server, Cpu, HardDrive,
  Wifi, Eye, Users, BarChart3, Settings, RefreshCw
} from 'lucide-react'
import blink from '../blink/client'

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface OptimizationSuggestion {
  id: string
  category: 'performance' | 'security' | 'seo' | 'accessibility'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  implemented: boolean
}

interface SystemHealth {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
  errors: number
}

export function PerformanceOptimizer() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoOptimize, setAutoOptimize] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPerformanceData()
    const interval = setInterval(loadPerformanceData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadPerformanceData = async () => {
    try {
      // Simulate performance metrics collection
      const mockMetrics: PerformanceMetric[] = [
        {
          id: 'page-load',
          name: 'Page Load Time',
          value: 2.3,
          unit: 's',
          status: 'good',
          trend: 'down',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'first-paint',
          name: 'First Contentful Paint',
          value: 1.2,
          unit: 's',
          status: 'good',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'lcp',
          name: 'Largest Contentful Paint',
          value: 2.8,
          unit: 's',
          status: 'warning',
          trend: 'up',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'cls',
          name: 'Cumulative Layout Shift',
          value: 0.15,
          unit: '',
          status: 'warning',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'fid',
          name: 'First Input Delay',
          value: 45,
          unit: 'ms',
          status: 'good',
          trend: 'down',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'bundle-size',
          name: 'Bundle Size',
          value: 1.2,
          unit: 'MB',
          status: 'good',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        }
      ]
      
      setMetrics(mockMetrics)
      
      // System health simulation
      setSystemHealth({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100,
        uptime: 99.9,
        errors: Math.floor(Math.random() * 10)
      })
      
      // Load optimization suggestions
      await loadOptimizationSuggestions()
      
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const loadOptimizationSuggestions = async () => {
    const mockSuggestions: OptimizationSuggestion[] = [
      {
        id: 'image-optimization',
        category: 'performance',
        title: 'Optimize Images',
        description: 'Convert images to WebP format and implement lazy loading to reduce bundle size by ~40%.',
        impact: 'high',
        effort: 'medium',
        implemented: false
      },
      {
        id: 'code-splitting',
        category: 'performance',
        title: 'Implement Code Splitting',
        description: 'Split JavaScript bundles by route to reduce initial load time.',
        impact: 'high',
        effort: 'medium',
        implemented: false
      },
      {
        id: 'cdn-setup',
        category: 'performance',
        title: 'Setup CDN',
        description: 'Use Cloudflare CDN to serve static assets from edge locations.',
        impact: 'medium',
        effort: 'low',
        implemented: false
      },
      {
        id: 'caching-strategy',
        category: 'performance',
        title: 'Implement Caching',
        description: 'Add Redis caching for API responses and database queries.',
        impact: 'high',
        effort: 'high',
        implemented: false
      },
      {
        id: 'security-headers',
        category: 'security',
        title: 'Security Headers',
        description: 'Add security headers like CSP, HSTS, and X-Frame-Options.',
        impact: 'medium',
        effort: 'low',
        implemented: false
      },
      {
        id: 'seo-meta',
        category: 'seo',
        title: 'SEO Meta Tags',
        description: 'Add comprehensive meta tags, Open Graph, and structured data.',
        impact: 'medium',
        effort: 'low',
        implemented: false
      }
    ]
    
    setSuggestions(mockSuggestions)
  }

  const implementSuggestion = async (suggestionId: string) => {
    setLoading(true)
    try {
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (!suggestion) return
      
      // Simulate implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update suggestion status
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestionId 
            ? { ...s, implemented: true }
            : s
        )
      )
      
      toast({
        title: 'Optimization Applied',
        description: `${suggestion.title} has been implemented successfully.`
      })
      
      // Refresh metrics after implementation
      setTimeout(loadPerformanceData, 1000)
      
    } catch (error) {
      toast({
        title: 'Implementation Failed',
        description: 'Failed to apply optimization. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const runFullOptimization = async () => {
    setLoading(true)
    try {
      const unimplementedSuggestions = suggestions.filter(s => !s.implemented)
      
      for (const suggestion of unimplementedSuggestions) {
        await implementSuggestion(suggestion.id)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between implementations
      }
      
      toast({
        title: 'Full Optimization Complete',
        description: 'All available optimizations have been applied.'
      })
      
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Some optimizations failed to apply.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Clock
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingUp
      case 'stable': return Activity
      default: return Activity
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return Zap
      case 'security': return Shield
      case 'seo': return Globe
      case 'accessibility': return Eye
      default: return Settings
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Optimizer</h2>
          <p className="text-muted-foreground">Monitor, analyze, and optimize your application performance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadPerformanceData}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={runFullOptimization}
            disabled={loading}
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-Optimize
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.cpu.toFixed(1)}%</div>
              <Progress value={systemHealth.cpu} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.memory.toFixed(1)}%</div>
              <Progress value={systemHealth.memory} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="w-4 h-4" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.uptime}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.errors}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const StatusIcon = getStatusIcon(metric.status)
              const TrendIcon = getTrendIcon(metric.trend)
              
              return (
                <Card key={metric.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                      <StatusIcon className={`w-4 h-4 ${getStatusColor(metric.status)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {metric.value}{metric.unit}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendIcon className={`w-4 h-4 ${
                          metric.trend === 'up' ? 'text-red-500 rotate-180' :
                          metric.trend === 'down' ? 'text-green-500' :
                          'text-gray-500'
                        }`} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated {new Date(metric.lastUpdated).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Optimization Suggestions</h3>
            <Badge variant="secondary">
              {suggestions.filter(s => !s.implemented).length} Pending
            </Badge>
          </div>
          
          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const CategoryIcon = getCategoryIcon(suggestion.category)
              
              return (
                <Card key={suggestion.id} className={suggestion.implemented ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {suggestion.title}
                            {suggestion.implemented && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {suggestion.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getImpactColor(suggestion.impact)}>
                          {suggestion.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.effort} effort
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!suggestion.implemented ? (
                      <Button 
                        onClick={() => implementSuggestion(suggestion.id)}
                        disabled={loading}
                        size="sm"
                      >
                        {loading ? 'Implementing...' : 'Implement'}
                      </Button>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Implemented
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>
                Live performance metrics and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    All systems operational. No critical issues detected.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Response Times</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>API Endpoints</span>
                        <span className="text-green-600">~120ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Database Queries</span>
                        <span className="text-green-600">~45ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Static Assets</span>
                        <span className="text-green-600">~25ms</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Traffic</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Active Users</span>
                        <span>1,234</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Requests/min</span>
                        <span>5,678</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Error Rate</span>
                        <span className="text-green-600">0.02%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>
                Historical data and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Detailed Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Generate comprehensive performance reports with historical data,
                  trend analysis, and optimization recommendations.
                </p>
                <Button>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}