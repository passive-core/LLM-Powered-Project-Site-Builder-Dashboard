import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Cpu, Database, Globe, 
  HardDrive, MemoryStick, Network, Server, TrendingUp, TrendingDown,
  Zap, Eye, Settings, RefreshCw, Download, Upload, Wifi, WifiOff
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  timestamp: string
  category: 'cpu' | 'memory' | 'network' | 'database' | 'api' | 'user'
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  uptime: number
  responseTime: number
  errorRate: number
  throughput: number
  activeUsers: number
  lastUpdated: string
}

interface Alert {
  id: string
  type: 'performance' | 'error' | 'security' | 'capacity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
  projectId?: string
}

interface WebVital {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  description: string
}

const mockMetrics: PerformanceMetric[] = [
  { id: '1', name: 'CPU Usage', value: 45, unit: '%', status: 'good', trend: 'stable', timestamp: new Date().toISOString(), category: 'cpu' },
  { id: '2', name: 'Memory Usage', value: 68, unit: '%', status: 'warning', trend: 'up', timestamp: new Date().toISOString(), category: 'memory' },
  { id: '3', name: 'Network Latency', value: 120, unit: 'ms', status: 'good', trend: 'down', timestamp: new Date().toISOString(), category: 'network' },
  { id: '4', name: 'Database Queries/sec', value: 1250, unit: 'qps', status: 'good', trend: 'up', timestamp: new Date().toISOString(), category: 'database' },
  { id: '5', name: 'API Response Time', value: 85, unit: 'ms', status: 'good', trend: 'stable', timestamp: new Date().toISOString(), category: 'api' },
  { id: '6', name: 'Active Users', value: 342, unit: 'users', status: 'good', trend: 'up', timestamp: new Date().toISOString(), category: 'user' }
]

const mockTimeSeriesData = Array.from({ length: 24 }, (_, i) => ({
  time: `${23 - i}h ago`,
  cpu: Math.random() * 100,
  memory: Math.random() * 100,
  network: Math.random() * 200 + 50,
  responseTime: Math.random() * 100 + 50,
  users: Math.floor(Math.random() * 500) + 100
}))

const mockWebVitals: WebVital[] = [
  { name: 'First Contentful Paint', value: 1.2, rating: 'good', description: 'Time until first content appears' },
  { name: 'Largest Contentful Paint', value: 2.1, rating: 'needs-improvement', description: 'Time until largest content appears' },
  { name: 'First Input Delay', value: 45, rating: 'good', description: 'Time until page becomes interactive' },
  { name: 'Cumulative Layout Shift', value: 0.08, rating: 'needs-improvement', description: 'Visual stability of the page' }
]

export default function PerformanceMonitor() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PerformanceMetric[]>(mockMetrics)
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'healthy',
    uptime: 99.9,
    responseTime: 85,
    errorRate: 0.02,
    throughput: 1250,
    activeUsers: 342,
    lastUpdated: new Date().toISOString()
  })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [webVitals, setWebVitals] = useState<WebVital[]>(mockWebVitals)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [isMonitoring, setIsMonitoring] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      intervalRef.current = setInterval(() => {
        refreshMetrics()
      }, refreshInterval * 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, isMonitoring])

  useEffect(() => {
    if (user) {
      loadAlerts()
      initializeRealTimeMonitoring()
    }
  }, [user])

  const loadAlerts = async () => {
    try {
      // In a real implementation, load from database
      const mockAlerts: Alert[] = [
        {
          id: 'alert_1',
          type: 'performance',
          severity: 'medium',
          message: 'Memory usage above 70% for 5 minutes',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: 'alert_2',
          type: 'error',
          severity: 'low',
          message: 'Increased 404 errors detected',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: true
        }
      ]
      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const initializeRealTimeMonitoring = () => {
    // Initialize performance observer for real browser metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Monitor Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              updateWebVitals({
                name: 'Page Load Time',
                value: navEntry.loadEventEnd - navEntry.loadEventStart,
                rating: navEntry.loadEventEnd - navEntry.loadEventStart < 2000 ? 'good' : 'needs-improvement',
                description: 'Total page load time'
              })
            }
          }
        })
        
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
      } catch (error) {
        console.warn('Performance monitoring not supported:', error)
      }
    }
  }

  const updateWebVitals = (vital: WebVital) => {
    setWebVitals(prev => {
      const existing = prev.find(v => v.name === vital.name)
      if (existing) {
        return prev.map(v => v.name === vital.name ? vital : v)
      }
      return [...prev, vital]
    })
  }

  const refreshMetrics = async () => {
    try {
      // Simulate fetching real metrics
      const updatedMetrics = metrics.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10,
        timestamp: new Date().toISOString(),
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      }))
      
      setMetrics(updatedMetrics)
      
      // Update system health
      setSystemHealth(prev => ({
        ...prev,
        responseTime: prev.responseTime + (Math.random() - 0.5) * 20,
        errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.01),
        throughput: prev.throughput + (Math.random() - 0.5) * 100,
        activeUsers: Math.max(0, prev.activeUsers + Math.floor((Math.random() - 0.5) * 50)),
        lastUpdated: new Date().toISOString()
      }))
      
      // Check for new alerts
      checkForAlerts(updatedMetrics)
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
      toast.error('Failed to refresh performance metrics')
    }
  }

  const checkForAlerts = (currentMetrics: PerformanceMetric[]) => {
    const newAlerts: Alert[] = []
    
    currentMetrics.forEach(metric => {
      if (metric.status === 'critical' || (metric.status === 'warning' && metric.value > 80)) {
        const existingAlert = alerts.find(a => a.message.includes(metric.name) && !a.resolved)
        if (!existingAlert) {
          newAlerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'performance',
            severity: metric.status === 'critical' ? 'critical' : 'medium',
            message: `${metric.name} is ${metric.status}: ${metric.value}${metric.unit}`,
            timestamp: new Date().toISOString(),
            resolved: false
          })
        }
      }
    })
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev])
      newAlerts.forEach(alert => {
        toast.error(`Alert: ${alert.message}`)
      })
    }
  }

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
    toast.success('Alert resolved')
  }

  const exportMetrics = async () => {
    try {
      const data = {
        metrics,
        systemHealth,
        webVitals,
        alerts: alerts.filter(a => !a.resolved),
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Performance report exported')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export metrics')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': case 'healthy': return 'text-green-500'
      case 'warning': case 'needs-improvement': case 'degraded': return 'text-yellow-500'
      case 'critical': case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning': case 'needs-improvement': case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'critical': case 'poor': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cpu': return <Cpu className="w-5 h-5" />
      case 'memory': return <MemoryStick className="w-5 h-5" />
      case 'network': return <Network className="w-5 h-5" />
      case 'database': return <Database className="w-5 h-5" />
      case 'api': return <Server className="w-5 h-5" />
      case 'user': return <Eye className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitor</h1>
          <p className="text-muted-foreground">Real-time system performance and health monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(systemHealth.overall)}
              System Health
            </CardTitle>
            <Badge variant={systemHealth.overall === 'healthy' ? 'default' : 'destructive'}>
              {systemHealth.overall.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{systemHealth.uptime}%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemHealth.responseTime}ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{(systemHealth.errorRate * 100).toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemHealth.throughput}</div>
              <div className="text-sm text-muted-foreground">Requests/sec</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemHealth.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{isMonitoring ? 'Online' : 'Offline'}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                {isMonitoring ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                Status
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(metric.category)}
                      <CardTitle className="text-lg">{metric.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(metric.status)}
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold ${getStatusColor(metric.status)}`}>
                        {metric.value.toFixed(metric.unit === '%' ? 0 : 1)}
                      </span>
                      <span className="text-muted-foreground">{metric.unit}</span>
                    </div>
                    
                    {metric.unit === '%' && (
                      <Progress 
                        value={metric.value} 
                        className="h-2" 
                        // @ts-expect-error - Legacy API compatibility
                        indicatorClassName={metric.status === 'critical' ? 'bg-red-500' : metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}
                      />
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Status: {metric.status}</span>
                      <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Performance Trends</h2>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockTimeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#ef4444" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Response Time & Network</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockTimeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="responseTime" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Response Time (ms)" />
                    <Area type="monotone" dataKey="network" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Network Latency (ms)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Active Users Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockTimeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8b5cf6" name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Core Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {webVitals.map((vital, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{vital.name}</CardTitle>
                      {getStatusIcon(vital.rating)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${getStatusColor(vital.rating)}`}>
                          {vital.value.toFixed(vital.name.includes('Shift') ? 3 : 1)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {vital.name.includes('Paint') || vital.name.includes('Delay') ? 's' : 
                           vital.name.includes('Shift') ? '' : 'ms'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{vital.description}</p>
                      <Badge variant={vital.rating === 'good' ? 'default' : vital.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                        {vital.rating.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Optimize Images</h4>
                    <p className="text-sm text-blue-700">Use WebP format and lazy loading to improve LCP scores</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Reduce Layout Shifts</h4>
                    <p className="text-sm text-yellow-700">Set explicit dimensions for images and ads to improve CLS</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Good Performance</h4>
                    <p className="text-sm text-green-700">Your FID and response times are within optimal ranges</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">System Alerts</h2>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{alerts.filter(a => !a.resolved).length} Active</Badge>
              <Badge variant="secondary">{alerts.filter(a => a.resolved).length} Resolved</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-medium mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">All systems are running smoothly</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={alert.resolved ? 'secondary' : 'destructive'}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.type}</Badge>
                            {alert.resolved && <Badge variant="default">Resolved</Badge>}
                          </div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Monitoring</h4>
                  <p className="text-sm text-muted-foreground">Turn on/off performance monitoring</p>
                </div>
                <Switch checked={isMonitoring} onCheckedChange={setIsMonitoring} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto Refresh</h4>
                  <p className="text-sm text-muted-foreground">Automatically refresh metrics</p>
                </div>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Refresh Interval</h4>
                <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage Warning</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage Warning</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">80%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time Warning</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">200ms</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={exportMetrics} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Performance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}