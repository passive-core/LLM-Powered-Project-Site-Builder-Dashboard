import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Switch } from './ui/switch'
import { Alert, AlertDescription } from './ui/alert'
import { ScrollArea } from './ui/scroll-area'
import {
  Bot, Zap, Shield, Activity, Clock, CheckCircle, AlertTriangle,
  Play, Pause, Settings, Monitor, Database, Globe, Mail, DollarSign,
  TrendingUp, Users, FileText, Calendar, Bell, RefreshCw
} from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface AutonomousAgent {
  id: string
  name: string
  type: 'monitoring' | 'maintenance' | 'optimization' | 'security' | 'financial' | 'communication'
  status: 'active' | 'paused' | 'error' | 'maintenance'
  description: string
  capabilities: string[]
  lastAction: string
  lastActionTime: string
  actionsToday: number
  successRate: number
  autonomyLevel: number // 0-100
  isEnabled: boolean
  schedule: {
    frequency: 'continuous' | 'hourly' | 'daily' | 'weekly'
    nextRun?: string
  }
  metrics: {
    tasksCompleted: number
    errorsHandled: number
    optimizationsApplied: number
    alertsGenerated: number
  }
}

interface SystemHealth {
  overall: number
  components: {
    database: number
    apis: number
    integrations: number
    security: number
    performance: number
  }
  issues: {
    critical: number
    warning: number
    info: number
  }
  uptime: number
  lastCheck: string
}

interface AutomationRule {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  isActive: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  lastTriggered?: string
  executionCount: number
  successRate: number
}

interface OperationLog {
  id: string
  timestamp: string
  agentId: string
  action: string
  status: 'success' | 'warning' | 'error'
  details: string
  impact: string
  duration: number
}

const AutonomousOperationSystem: React.FC = () => {
  const [agents, setAgents] = useState<AutonomousAgent[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [masterSwitch, setMasterSwitch] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  useEffect(() => {
    loadAgents()
    loadSystemHealth()
    loadAutomationRules()
    loadOperationLogs()
    startAutonomousOperations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAgents = () => {
    const mockAgents: AutonomousAgent[] = [
      {
        id: 'monitor-agent',
        name: 'System Monitor',
        type: 'monitoring',
        status: 'active',
        description: 'Continuously monitors system health and performance',
        capabilities: [
          'Real-time health monitoring',
          'Performance tracking',
          'Error detection',
          'Resource usage monitoring',
          'Uptime tracking'
        ],
        lastAction: 'Checked database performance - all systems normal',
        lastActionTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        actionsToday: 1247,
        successRate: 99.2,
        autonomyLevel: 95,
        isEnabled: true,
        schedule: { frequency: 'continuous' },
        metrics: {
          tasksCompleted: 1247,
          errorsHandled: 12,
          optimizationsApplied: 8,
          alertsGenerated: 3
        }
      },
      {
        id: 'maintenance-agent',
        name: 'Auto Maintenance',
        type: 'maintenance',
        status: 'active',
        description: 'Performs automated maintenance tasks and system cleanup',
        capabilities: [
          'Database cleanup',
          'Cache optimization',
          'Log rotation',
          'Temporary file cleanup',
          'Memory optimization'
        ],
        lastAction: 'Cleaned up temporary files - freed 2.3GB storage',
        lastActionTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        actionsToday: 24,
        successRate: 98.7,
        autonomyLevel: 85,
        isEnabled: true,
        schedule: { frequency: 'hourly', nextRun: new Date(Date.now() + 45 * 60 * 1000).toISOString() },
        metrics: {
          tasksCompleted: 24,
          errorsHandled: 2,
          optimizationsApplied: 15,
          alertsGenerated: 1
        }
      },
      {
        id: 'security-agent',
        name: 'Security Guardian',
        type: 'security',
        status: 'active',
        description: 'Monitors security threats and maintains system security',
        capabilities: [
          'Threat detection',
          'Access monitoring',
          'Vulnerability scanning',
          'Security updates',
          'Incident response'
        ],
        lastAction: 'Blocked 15 suspicious login attempts',
        lastActionTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        actionsToday: 156,
        successRate: 99.8,
        autonomyLevel: 90,
        isEnabled: true,
        schedule: { frequency: 'continuous' },
        metrics: {
          tasksCompleted: 156,
          errorsHandled: 0,
          optimizationsApplied: 3,
          alertsGenerated: 5
        }
      },
      {
        id: 'financial-agent',
        name: 'Financial Tracker',
        type: 'financial',
        status: 'active',
        description: 'Monitors financial transactions and revenue streams',
        capabilities: [
          'Revenue tracking',
          'Expense monitoring',
          'Payment processing',
          'Financial reporting',
          'Budget alerts'
        ],
        lastAction: 'Processed 12 PayPal transactions - $1,247.50 revenue',
        lastActionTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        actionsToday: 89,
        successRate: 99.5,
        autonomyLevel: 80,
        isEnabled: true,
        schedule: { frequency: 'continuous' },
        metrics: {
          tasksCompleted: 89,
          errorsHandled: 1,
          optimizationsApplied: 4,
          alertsGenerated: 2
        }
      },
      {
        id: 'communication-agent',
        name: 'Communication Hub',
        type: 'communication',
        status: 'active',
        description: 'Manages emails, notifications, and client communications',
        capabilities: [
          'Email processing',
          'Notification management',
          'Client communication',
          'Deal alerts',
          'Status updates'
        ],
        lastAction: 'Processed 47 emails - found 3 new deals',
        lastActionTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        actionsToday: 234,
        successRate: 97.8,
        autonomyLevel: 75,
        isEnabled: true,
        schedule: { frequency: 'continuous' },
        metrics: {
          tasksCompleted: 234,
          errorsHandled: 5,
          optimizationsApplied: 12,
          alertsGenerated: 8
        }
      },
      {
        id: 'optimization-agent',
        name: 'Performance Optimizer',
        type: 'optimization',
        status: 'active',
        description: 'Continuously optimizes system performance and efficiency',
        capabilities: [
          'Performance tuning',
          'Resource optimization',
          'Query optimization',
          'Cache management',
          'Load balancing'
        ],
        lastAction: 'Optimized database queries - 23% performance improvement',
        lastActionTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        actionsToday: 45,
        successRate: 96.2,
        autonomyLevel: 88,
        isEnabled: true,
        schedule: { frequency: 'hourly', nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
        metrics: {
          tasksCompleted: 45,
          errorsHandled: 3,
          optimizationsApplied: 23,
          alertsGenerated: 1
        }
      }
    ]
    setAgents(mockAgents)
  }

  const loadSystemHealth = () => {
    const mockHealth: SystemHealth = {
      overall: 94,
      components: {
        database: 98,
        apis: 92,
        integrations: 89,
        security: 97,
        performance: 95
      },
      issues: {
        critical: 0,
        warning: 2,
        info: 5
      },
      uptime: 99.8,
      lastCheck: new Date().toISOString()
    }
    setSystemHealth(mockHealth)
  }

  const loadAutomationRules = () => {
    const mockRules: AutomationRule[] = [
      {
        id: '1',
        name: 'High CPU Usage Alert',
        trigger: 'CPU usage > 80%',
        condition: 'Duration > 5 minutes',
        action: 'Send alert and optimize processes',
        isActive: true,
        priority: 'high',
        lastTriggered: '2024-01-25T14:30:00Z',
        executionCount: 12,
        successRate: 100
      },
      {
        id: '2',
        name: 'Database Backup',
        trigger: 'Daily at 2:00 AM',
        condition: 'System idle',
        action: 'Create database backup',
        isActive: true,
        priority: 'medium',
        lastTriggered: '2024-01-25T02:00:00Z',
        executionCount: 30,
        successRate: 98.5
      },
      {
        id: '3',
        name: 'Revenue Milestone Alert',
        trigger: 'Daily revenue > $1000',
        condition: 'Verified transactions',
        action: 'Send celebration notification',
        isActive: true,
        priority: 'low',
        lastTriggered: '2024-01-24T18:45:00Z',
        executionCount: 8,
        successRate: 100
      },
      {
        id: '4',
        name: 'Security Threat Response',
        trigger: 'Multiple failed login attempts',
        condition: '>5 attempts in 10 minutes',
        action: 'Block IP and send alert',
        isActive: true,
        priority: 'critical',
        lastTriggered: '2024-01-25T10:15:00Z',
        executionCount: 3,
        successRate: 100
      }
    ]
    setAutomationRules(mockRules)
  }

  const loadOperationLogs = () => {
    const mockLogs: OperationLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        agentId: 'monitor-agent',
        action: 'System Health Check',
        status: 'success',
        details: 'All systems operating normally',
        impact: 'Maintained system stability',
        duration: 1.2
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        agentId: 'financial-agent',
        action: 'Revenue Processing',
        status: 'success',
        details: 'Processed 12 PayPal transactions totaling $1,247.50',
        impact: 'Updated financial records',
        duration: 3.8
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        agentId: 'security-agent',
        action: 'Threat Detection',
        status: 'warning',
        details: 'Blocked 15 suspicious login attempts from IP 192.168.1.100',
        impact: 'Enhanced security posture',
        duration: 0.5
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        agentId: 'optimization-agent',
        action: 'Database Optimization',
        status: 'success',
        details: 'Optimized 15 slow queries, improved performance by 23%',
        impact: 'Faster response times',
        duration: 45.2
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        agentId: 'maintenance-agent',
        action: 'System Cleanup',
        status: 'success',
        details: 'Cleaned temporary files, freed 2.3GB storage space',
        impact: 'Improved storage efficiency',
        duration: 12.7
      }
    ]
    setOperationLogs(mockLogs)
  }

  const startAutonomousOperations = () => {
    // Simulate continuous autonomous operations
    const interval = setInterval(() => {
      if (masterSwitch && isMonitoring) {
        // Simulate agent actions
        simulateAgentActions()
        // Update system health
        updateSystemHealth()
        // Generate new logs
        generateOperationLogs()
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }

  const simulateAgentActions = () => {
    setAgents(prev => prev.map(agent => {
      if (!agent.isEnabled) return agent

      const actions = {
        monitoring: [
          'Checked system performance metrics',
          'Monitored database connections',
          'Verified API response times',
          'Scanned for error patterns',
          'Updated health dashboard'
        ],
        maintenance: [
          'Cleaned temporary files',
          'Optimized database indexes',
          'Rotated log files',
          'Updated system caches',
          'Performed memory cleanup'
        ],
        security: [
          'Scanned for vulnerabilities',
          'Monitored access patterns',
          'Updated security rules',
          'Blocked suspicious activity',
          'Verified SSL certificates'
        ],
        financial: [
          'Processed payment transactions',
          'Updated revenue tracking',
          'Monitored expense categories',
          'Generated financial alerts',
          'Synchronized payment data'
        ],
        communication: [
          'Processed incoming emails',
          'Sent automated notifications',
          'Updated client communications',
          'Filtered spam messages',
          'Generated status reports'
        ],
        optimization: [
          'Optimized database queries',
          'Improved cache efficiency',
          'Balanced system load',
          'Tuned performance parameters',
          'Reduced resource usage'
        ]
      }

      const randomAction = actions[agent.type][Math.floor(Math.random() * actions[agent.type].length)]
      
      return {
        ...agent,
        lastAction: randomAction,
        lastActionTime: new Date().toISOString(),
        actionsToday: agent.actionsToday + 1,
        metrics: {
          ...agent.metrics,
          tasksCompleted: agent.metrics.tasksCompleted + 1
        }
      }
    }))
  }

  const updateSystemHealth = () => {
    setSystemHealth(prev => {
      if (!prev) return prev
      
      // Simulate minor fluctuations in health metrics
      const fluctuation = () => Math.random() * 4 - 2 // -2 to +2
      
      return {
        ...prev,
        overall: Math.max(85, Math.min(100, prev.overall + fluctuation())),
        components: {
          database: Math.max(85, Math.min(100, prev.components.database + fluctuation())),
          apis: Math.max(85, Math.min(100, prev.components.apis + fluctuation())),
          integrations: Math.max(80, Math.min(100, prev.components.integrations + fluctuation())),
          security: Math.max(90, Math.min(100, prev.components.security + fluctuation())),
          performance: Math.max(85, Math.min(100, prev.components.performance + fluctuation()))
        },
        lastCheck: new Date().toISOString()
      }
    })
  }

  const generateOperationLogs = () => {
    if (Math.random() < 0.3) { // 30% chance to generate a new log
      const activeAgents = agents.filter(a => a.isEnabled)
      if (activeAgents.length === 0) return
      
      const randomAgent = activeAgents[Math.floor(Math.random() * activeAgents.length)]
      const statuses: ('success' | 'warning' | 'error')[] = ['success', 'success', 'success', 'warning', 'error']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      
      const newLog: OperationLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentId: randomAgent.id,
        action: randomAgent.lastAction,
        status: randomStatus,
        details: `Automated ${randomAgent.type} operation completed`,
        impact: randomStatus === 'success' ? 'Positive system impact' : 'Requires attention',
        duration: Math.random() * 30 + 1
      }
      
      setOperationLogs(prev => [newLog, ...prev.slice(0, 49)]) // Keep only 50 most recent logs
    }
  }

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, isEnabled: !agent.isEnabled, status: !agent.isEnabled ? 'active' : 'paused' }
        : agent
    ))
  }

  const toggleAutomationRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'maintenance': return <Settings className="h-4 w-4 text-blue-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'monitoring': return <Monitor className="h-5 w-5" />
      case 'maintenance': return <Settings className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'financial': return <DollarSign className="h-5 w-5" />
      case 'communication': return <Mail className="h-5 w-5" />
      case 'optimization': return <Zap className="h-5 w-5" />
      default: return <Bot className="h-5 w-5" />
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Autonomous Operation System</h1>
          <p className="text-muted-foreground">Self-managing system for 24/7 autonomous operation</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Master Control</span>
            <Switch checked={masterSwitch} onCheckedChange={setMasterSwitch} />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Monitoring</span>
            <Switch checked={isMonitoring} onCheckedChange={setIsMonitoring} />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Alerts</span>
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
          </div>
        </div>
      </div>

      {/* System Status */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Overall Health</p>
                  <p className={`text-lg font-bold ${getHealthColor(systemHealth.overall)}`}>
                    {systemHealth.overall.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Database</p>
                  <p className={`text-lg font-bold ${getHealthColor(systemHealth.components.database)}`}>
                    {systemHealth.components.database.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">APIs</p>
                  <p className={`text-lg font-bold ${getHealthColor(systemHealth.components.apis)}`}>
                    {systemHealth.components.apis.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Security</p>
                  <p className={`text-lg font-bold ${getHealthColor(systemHealth.components.security)}`}>
                    {systemHealth.components.security.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Performance</p>
                  <p className={`text-lg font-bold ${getHealthColor(systemHealth.components.performance)}`}>
                    {systemHealth.components.performance.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Uptime</p>
                  <p className={`text-lg font-bold ${getHealthColor(systemHealth.uptime)}`}>
                    {systemHealth.uptime.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Issues Alert */}
      {systemHealth && (systemHealth.issues.critical > 0 || systemHealth.issues.warning > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System has {systemHealth.issues.critical} critical issues and {systemHealth.issues.warning} warnings that require attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="logs">Operation Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Agents */}
            <Card>
              <CardHeader>
                <CardTitle>Active Agents</CardTitle>
                <CardDescription>Currently running autonomous agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {agents.filter(a => a.isEnabled).map(agent => (
                      <div key={agent.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            {React.createElement(getTypeIcon(agent.type), { className: 'text-blue-600' })}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.lastAction}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(agent.lastActionTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.status)}
                          <Badge variant="outline" className="text-xs">
                            {agent.actionsToday} today
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>Latest autonomous operations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {operationLogs.slice(0, 10).map(log => {
                      const agent = agents.find(a => a.id === log.agentId)
                      return (
                        <div key={log.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getLogStatusColor(log.status)}`}>
                                {log.status}
                              </Badge>
                              <span className="text-sm font-medium">{agent?.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{log.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="space-y-4">
            {agents.map(agent => (
              <Card key={agent.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-full bg-blue-100">
                        {React.createElement(getTypeIcon(agent.type), { className: 'text-blue-600 h-6 w-6' })}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <p className="text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(agent.status)}
                      <Switch 
                        checked={agent.isEnabled} 
                        onCheckedChange={() => toggleAgent(agent.id)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Actions Today</p>
                      <p className="text-xl font-bold">{agent.actionsToday}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="text-xl font-bold">{agent.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Autonomy Level</p>
                      <p className="text-xl font-bold">{agent.autonomyLevel}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                      <p className="text-sm font-medium capitalize">{agent.schedule.frequency}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Last Action:</p>
                    <p className="text-sm text-muted-foreground">{agent.lastAction}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(agent.lastActionTime).toLocaleString()}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Capabilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.map((capability, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tasks Completed</p>
                      <p className="font-medium">{agent.metrics.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Errors Handled</p>
                      <p className="font-medium">{agent.metrics.errorsHandled}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Optimizations</p>
                      <p className="font-medium">{agent.metrics.optimizationsApplied}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Alerts Generated</p>
                      <p className="font-medium">{agent.metrics.alertsGenerated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Automation Rules</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
            
            {automationRules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{rule.name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1 mt-2">
                        <p><strong>Trigger:</strong> {rule.trigger}</p>
                        <p><strong>Condition:</strong> {rule.condition}</p>
                        <p><strong>Action:</strong> {rule.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${rule.priority === 'critical' ? 'bg-red-500' : rule.priority === 'high' ? 'bg-orange-500' : rule.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                        {rule.priority}
                      </Badge>
                      <Switch 
                        checked={rule.isActive} 
                        onCheckedChange={() => toggleAutomationRule(rule.id)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Executions</p>
                      <p className="font-medium">{rule.executionCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">{rule.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Triggered</p>
                      <p className="font-medium">
                        {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Operation Logs</h3>
            <Button variant="outline" onClick={() => setOperationLogs([])}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </div>
          
          <div className="space-y-3">
            {operationLogs.map(log => {
              const agent = agents.find(a => a.id === log.agentId)
              return (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`text-xs ${getLogStatusColor(log.status)}`}>
                            {log.status}
                          </Badge>
                          <span className="font-medium">{agent?.name || 'Unknown Agent'}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{log.action}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Impact: {log.impact}</span>
                          <span>Duration: {log.duration.toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure autonomous operation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Master Control</p>
                    <p className="text-sm text-muted-foreground">Enable/disable all autonomous operations</p>
                  </div>
                  <Switch checked={masterSwitch} onCheckedChange={setMasterSwitch} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Real-time Monitoring</p>
                    <p className="text-sm text-muted-foreground">Continuous system health monitoring</p>
                  </div>
                  <Switch checked={isMonitoring} onCheckedChange={setIsMonitoring} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alert Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts for critical events</p>
                  </div>
                  <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {agents.filter(a => a.isEnabled).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {agents.reduce((sum, a) => sum + a.actionsToday, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Actions Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {systemHealth?.uptime.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">System Uptime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AutonomousOperationSystem