import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, Filter, Bell, Settings, Activity, TrendingUp, Users, Zap, MessageSquare, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { getEnabledServices } from '../services'
import { ProjectModal } from './ProjectModal'
import { ChatAssistant } from './ChatAssistant'
import { WorkflowChart } from './WorkflowChart'
import { ProjectAssistantBot } from './ProjectAssistantBot'
import type { Project } from '../types/project'

interface ServiceSummary {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'error'
  metrics: {
    total: number
    active: number
    completed: number
    pending: number
  }
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
  healthScore: number
}

interface SystemHealth {
  overall: number
  memory: number
  performance: number
  errors: number
  uptime: string
}

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: () => void
  category: 'create' | 'manage' | 'analyze'
}

export function ComprehensiveHomeDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [serviceSummaries, setServiceSummaries] = useState<ServiceSummary[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 95,
    memory: 78,
    performance: 92,
    errors: 2,
    uptime: '99.9%'
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [notifications, setNotifications] = useState<any[]>([])
  const { user, isAuthenticated } = useAuth()
  const enabledServices = getEnabledServices()

  const refreshSystemHealth = useCallback(async () => {
    try {
      // Simulate health check
      const newHealth = {
        overall: Math.floor(Math.random() * 20) + 80,
        memory: Math.floor(Math.random() * 30) + 70,
        performance: Math.floor(Math.random() * 20) + 80,
        errors: Math.floor(Math.random() * 5),
        uptime: '99.9%'
      }
      setSystemHealth(newHealth)
    } catch (error) {
      console.error('Failed to refresh system health:', error)
    }
  }, [])

  const generateQuickContent = useCallback(async () => {
    try {
      const { text } = await blink.ai.generateText({
        prompt: 'Generate a quick project idea for a web application that could be built with modern tools',
        maxTokens: 100
      })
      
      // Show the generated idea in a notification or modal
      console.log('Generated idea:', text)
    } catch (error) {
      console.error('Failed to generate content:', error)
    }
  }, [])

  // Quick Actions Configuration
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'new-project',
      label: 'New Project',
      icon: Plus,
      action: () => setIsProjectModalOpen(true),
      category: 'create'
    },
    {
      id: 'ai-chat',
      label: 'AI Assistant',
      icon: MessageSquare,
      action: () => setIsAssistantOpen(true),
      category: 'analyze'
    },
    {
      id: 'health-check',
      label: 'System Health',
      icon: Activity,
      action: () => refreshSystemHealth(),
      category: 'manage'
    },
    {
      id: 'generate-content',
      label: 'Generate Content',
      icon: Zap,
      action: () => generateQuickContent(),
      category: 'create'
    }
  ], [refreshSystemHealth, generateQuickContent])

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Load projects
      const userProjects = await blink.db.projects.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        limit: 10
      })
      setProjects(userProjects)

      // Load service summaries
      const summaries = await Promise.all(
        enabledServices.map(async (service) => {
          try {
            // Call service summary endpoint
            const response = await blink.data.fetch({
              url: `${service.endpoint}/summary`,
              method: 'GET'
            })
            
            return {
              id: service.id,
              name: service.name,
              status: response.body?.status || 'healthy',
              metrics: response.body?.metrics || {
                total: Math.floor(Math.random() * 100),
                active: Math.floor(Math.random() * 50),
                completed: Math.floor(Math.random() * 30),
                pending: Math.floor(Math.random() * 20)
              },
              lastUpdated: new Date().toISOString(),
              trend: response.body?.trend || 'stable',
              healthScore: response.body?.healthScore || Math.floor(Math.random() * 40) + 60
            } as ServiceSummary
          } catch (error) {
            // Fallback data if service is unavailable
            return {
              id: service.id,
              name: service.name,
              status: 'warning',
              metrics: {
                total: Math.floor(Math.random() * 100),
                active: Math.floor(Math.random() * 50),
                completed: Math.floor(Math.random() * 30),
                pending: Math.floor(Math.random() * 20)
              },
              lastUpdated: new Date().toISOString(),
              trend: 'stable',
              healthScore: Math.floor(Math.random() * 40) + 60
            } as ServiceSummary
          }
        })
      )
      setServiceSummaries(summaries)

      // Load recent activity/notifications
      const recentActivity = await blink.db.activityLogs.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5
      })
      setNotifications(recentActivity)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
      setLastRefresh(new Date())
    }
  }, [user, enabledServices])

  // Auto-refresh dashboard data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData()
      
      // Set up periodic refresh
      const interval = setInterval(loadDashboardData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user, loadDashboardData])

  // Real-time updates via Firestore listeners
  useEffect(() => {
    if (!user) return

    // Listen for project updates
    const unsubscribeProjects = blink.realtime.subscribe('projects', (message) => {
      if (message.type === 'project_updated' && message.data.userId === user.id) {
        loadDashboardData()
      }
    })

    // Listen for system events
    const unsubscribeSystem = blink.realtime.subscribe('system_events', (message) => {
      if (message.type === 'health_update') {
        setSystemHealth(prev => ({ ...prev, ...message.data }))
      }
    })

    return () => {
      unsubscribeProjects()
      unsubscribeSystem()
    }
  }, [user, loadDashboardData])

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return serviceSummaries
    return serviceSummaries.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [serviceSummaries, searchQuery])

  const overallMetrics = useMemo(() => {
    const totals = serviceSummaries.reduce((acc, service) => ({
      total: acc.total + service.metrics.total,
      active: acc.active + service.metrics.active,
      completed: acc.completed + service.metrics.completed,
      pending: acc.pending + service.metrics.pending
    }), { total: 0, active: 0, completed: 0, pending: 0 })

    return {
      ...totals,
      avgHealthScore: serviceSummaries.length > 0 
        ? Math.round(serviceSummaries.reduce((acc, s) => acc + s.healthScore, 0) / serviceSummaries.length)
        : 0,
      healthyServices: serviceSummaries.filter(s => s.status === 'healthy').length,
      totalServices: serviceSummaries.length
    }
  }, [serviceSummaries])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Welcome to Your Home Base</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to access your comprehensive AI-powered project management dashboard.
          </p>
          <Button onClick={() => blink.auth.login()} className="w-full">
            Sign In to Continue
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Home Base</h1>
              </div>
              
              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search across all modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Quick Actions */}
              <div className="flex items-center space-x-1">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={action.id}
                      variant="ghost"
                      size="sm"
                      onClick={action.action}
                      className="flex items-center space-x-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  )
                })}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              
              {/* Refresh */}
              <Button variant="ghost" size="sm" onClick={loadDashboardData}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* System Health Strip */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>System Health</span>
                  </CardTitle>
                  <Badge variant={systemHealth.overall > 90 ? 'default' : systemHealth.overall > 70 ? 'secondary' : 'destructive'}>
                    {systemHealth.overall}% Overall
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Memory</span>
                      <span>{systemHealth.memory}%</span>
                    </div>
                    <Progress value={systemHealth.memory} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance</span>
                      <span>{systemHealth.performance}%</span>
                    </div>
                    <Progress value={systemHealth.performance} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uptime</span>
                      <span>{systemHealth.uptime}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Errors</span>
                      <span className={systemHealth.errors > 0 ? 'text-destructive' : 'text-green-600'}>
                        {systemHealth.errors}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold">{projects.length}</p>
                    </div>
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                      <p className="text-2xl font-bold">{overallMetrics.healthyServices}/{overallMetrics.totalServices}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Health Score</p>
                      <p className="text-2xl font-bold">{overallMetrics.avgHealthScore}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                      <p className="text-2xl font-bold">{overallMetrics.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Analysis & Bot Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowChart />
              </CardContent>
            </Card>

            {/* Helper Bots Section */}
            <Card>
              <CardHeader>
                <CardTitle>AI Helper Bots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <ProjectAssistantBot />
                </div>
              </CardContent>
            </Card>

            {/* Service Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Module Status</span>
                  <Badge variant="outline">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{service.name}</h3>
                          <Badge variant={service.status === 'healthy' ? 'default' : service.status === 'warning' ? 'secondary' : 'destructive'}>
                            {service.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Health Score</span>
                            <span className="font-medium">{service.healthScore}%</span>
                          </div>
                          <Progress value={service.healthScore} className="h-2" />
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                            <div>Total: {service.metrics.total}</div>
                            <div>Active: {service.metrics.active}</div>
                            <div>Completed: {service.metrics.completed}</div>
                            <div>Pending: {service.metrics.pending}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No projects yet</p>
                    <Button onClick={() => setIsProjectModalOpen(true)}>
                      Create Your First Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <h4 className="font-medium">{project.title}</h4>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={project.status === 'published' ? 'default' : project.status === 'in_progress' ? 'secondary' : 'outline'}>
                            {project.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Persistent Assistant Panel */}
        <div className={`border-l border-border transition-all duration-300 ${isAssistantCollapsed ? 'w-12' : 'w-80'} flex flex-col`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!isAssistantCollapsed && (
                <h3 className="font-semibold flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Assistant</span>
                </h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAssistantCollapsed(!isAssistantCollapsed)}
              >
                {isAssistantCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {!isAssistantCollapsed && (
            <div className="flex-1 overflow-hidden">
              <ChatAssistant 
                context={{
                  projects,
                  serviceSummaries,
                  systemHealth,
                  overallMetrics
                }}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onProjectCreated={(project) => {
          setProjects(prev => [project, ...prev])
          setIsProjectModalOpen(false)
        }} 
      />

      <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>AI Assistant</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 pt-0">
            <ChatAssistant 
              context={{
                projects,
                serviceSummaries,
                systemHealth,
                overallMetrics
              }}
              onClose={() => setIsAssistantOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}