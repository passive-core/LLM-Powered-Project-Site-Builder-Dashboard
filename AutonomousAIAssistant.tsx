import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { ScrollArea } from './ui/scroll-area'
import { 
  Bot, Brain, Zap, Play, Pause, Settings, Plus, Trash2, Copy, Edit, 
  ArrowRight, ArrowDown, GitBranch, Clock, CheckCircle, AlertTriangle,
  Database, Globe, Mail, MessageSquare, FileText, Image, Video,
  Cpu, Network, Code, Sparkles, Target, Filter, Activity, BarChart3,
  Calendar, Users, Workflow, Shield, Key, RefreshCw, Power, Lightbulb,
  Search, Download, Upload, Share, Bell, Eye, EyeOff, Lock, Unlock
} from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface AIAgent {
  id: string
  name: string
  description: string
  type: 'dashboard' | 'project' | 'content' | 'analytics' | 'security' | 'optimization'
  status: 'active' | 'paused' | 'learning' | 'error'
  capabilities: string[]
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'fully-autonomous'
  lastAction: string
  lastActionTime: string
  successRate: number
  tasksCompleted: number
  learningProgress: number
  config: {
    autoExecute: boolean
    maxActionsPerHour: number
    requireApproval: boolean
    learningEnabled: boolean
    contextWindow: number
    priority: 'low' | 'medium' | 'high'
    domains: string[]
  }
  memory: {
    shortTerm: Array<{ timestamp: string; context: string; action: string; result: string }>
    longTerm: Array<{ pattern: string; frequency: number; success: boolean; context: string }>
    preferences: Record<string, any>
  }
  userId: string
  createdAt: string
  updatedAt: string
}

interface AITask {
  id: string
  agentId: string
  type: 'analysis' | 'optimization' | 'maintenance' | 'creation' | 'monitoring' | 'automation'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  progress: number
  estimatedDuration: number
  actualDuration?: number
  dependencies: string[]
  context: Record<string, any>
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
  scheduledFor?: string
  recurringPattern?: string
}

interface AIInsight {
  id: string
  agentId: string
  category: 'performance' | 'security' | 'optimization' | 'user_behavior' | 'trends' | 'anomalies'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  confidence: number
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  suggestedActions: string[]
  data: Record<string, any>
  createdAt: string
  acknowledged: boolean
}

const agentTypes = [
  {
    type: 'dashboard',
    name: 'Dashboard Manager',
    icon: BarChart3,
    color: 'bg-blue-500',
    description: 'Manages dashboard operations, monitors metrics, and optimizes layouts',
    capabilities: [
      'Real-time monitoring',
      'Performance optimization',
      'Layout management',
      'User experience analysis',
      'Automated reporting'
    ]
  },
  {
    type: 'project',
    name: 'Project Orchestrator',
    icon: Workflow,
    color: 'bg-green-500',
    description: 'Manages project lifecycles, dependencies, and automated workflows',
    capabilities: [
      'Project planning',
      'Dependency tracking',
      'Automated deployment',
      'Resource allocation',
      'Progress monitoring'
    ]
  },
  {
    type: 'content',
    name: 'Content Creator',
    icon: FileText,
    color: 'bg-purple-500',
    description: 'Generates, optimizes, and manages content across platforms',
    capabilities: [
      'Content generation',
      'SEO optimization',
      'Multi-platform publishing',
      'Content analysis',
      'Trend monitoring'
    ]
  },
  {
    type: 'analytics',
    name: 'Analytics Engine',
    icon: Activity,
    color: 'bg-orange-500',
    description: 'Analyzes data patterns, generates insights, and predicts trends',
    capabilities: [
      'Data analysis',
      'Predictive modeling',
      'Anomaly detection',
      'Report generation',
      'Trend forecasting'
    ]
  },
  {
    type: 'security',
    name: 'Security Guardian',
    icon: Shield,
    color: 'bg-red-500',
    description: 'Monitors security threats, manages access, and ensures compliance',
    capabilities: [
      'Threat detection',
      'Access management',
      'Compliance monitoring',
      'Vulnerability scanning',
      'Incident response'
    ]
  },
  {
    type: 'optimization',
    name: 'Performance Optimizer',
    icon: Zap,
    color: 'bg-yellow-500',
    description: 'Optimizes system performance, resource usage, and efficiency',
    capabilities: [
      'Performance tuning',
      'Resource optimization',
      'Cost reduction',
      'Efficiency analysis',
      'Automated scaling'
    ]
  }
]

export default function AutonomousAIAssistant() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [tasks, setTasks] = useState<AITask[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [autoMode, setAutoMode] = useState(true)
  const [systemStatus, setSystemStatus] = useState<'optimal' | 'warning' | 'critical'>('optimal')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (user) {
      loadAgents()
      loadTasks()
      loadInsights()
      startAutonomousOperations()
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAgents = async () => {
    try {
      // In production, load from ai_agents table
      const mockAgents: AIAgent[] = [
        {
          id: 'agent_dashboard_1',
          name: 'Dashboard Command Center',
          description: 'Primary dashboard management and optimization agent',
          type: 'dashboard',
          status: 'active',
          capabilities: [
            'Real-time monitoring',
            'Performance optimization',
            'Layout management',
            'User experience analysis',
            'Automated reporting'
          ],
          autonomyLevel: 'semi-autonomous',
          lastAction: 'Optimized dashboard layout for mobile users',
          lastActionTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          successRate: 94.2,
          tasksCompleted: 1247,
          learningProgress: 78,
          config: {
            autoExecute: true,
            maxActionsPerHour: 20,
            requireApproval: false,
            learningEnabled: true,
            contextWindow: 1000,
            priority: 'high',
            domains: ['dashboard', 'ui', 'performance']
          },
          memory: {
            shortTerm: [
              {
                timestamp: new Date().toISOString(),
                context: 'User complained about slow dashboard loading',
                action: 'Implemented lazy loading for heavy components',
                result: '40% improvement in load time'
              }
            ],
            longTerm: [
              {
                pattern: 'Mobile users prefer compact layouts',
                frequency: 23,
                success: true,
                context: 'UI optimization'
              }
            ],
            preferences: {
              optimizationStyle: 'performance-first',
              userFeedbackWeight: 0.8
            }
          },
          userId: user?.id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'agent_project_1',
          name: 'Project Automation Engine',
          description: 'Manages project workflows and automated deployments',
          type: 'project',
          status: 'active',
          capabilities: [
            'Project planning',
            'Dependency tracking',
            'Automated deployment',
            'Resource allocation',
            'Progress monitoring'
          ],
          autonomyLevel: 'fully-autonomous',
          lastAction: 'Deployed 3 projects with zero downtime',
          lastActionTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          successRate: 98.7,
          tasksCompleted: 892,
          learningProgress: 85,
          config: {
            autoExecute: true,
            maxActionsPerHour: 15,
            requireApproval: false,
            learningEnabled: true,
            contextWindow: 2000,
            priority: 'high',
            domains: ['projects', 'deployment', 'automation']
          },
          memory: {
            shortTerm: [],
            longTerm: [],
            preferences: {}
          },
          userId: user?.id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      setAgents(mockAgents)
      if (mockAgents.length > 0) {
        setSelectedAgent(mockAgents[0])
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const mockTasks: AITask[] = [
        {
          id: 'task_1',
          agentId: 'agent_dashboard_1',
          type: 'optimization',
          title: 'Optimize Dashboard Performance',
          description: 'Analyze and improve dashboard loading times',
          priority: 'high',
          status: 'in_progress',
          progress: 65,
          estimatedDuration: 30,
          dependencies: [],
          context: { targetMetric: 'load_time', threshold: 2000 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'task_2',
          agentId: 'agent_project_1',
          type: 'automation',
          title: 'Setup CI/CD Pipeline',
          description: 'Automate deployment process for new projects',
          priority: 'medium',
          status: 'completed',
          progress: 100,
          estimatedDuration: 45,
          actualDuration: 42,
          dependencies: [],
          context: { pipeline: 'github_actions', environment: 'production' },
          result: { success: true, deployments: 3 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      setTasks(mockTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const loadInsights = async () => {
    try {
      const mockInsights: AIInsight[] = [
        {
          id: 'insight_1',
          agentId: 'agent_dashboard_1',
          category: 'performance',
          title: 'Dashboard Load Time Anomaly',
          description: 'Detected 25% increase in dashboard load times over the past 24 hours',
          severity: 'warning',
          confidence: 87,
          impact: 'medium',
          actionable: true,
          suggestedActions: [
            'Enable component lazy loading',
            'Optimize database queries',
            'Implement caching strategy'
          ],
          data: { avgLoadTime: 3200, threshold: 2500, affected_users: 45 },
          createdAt: new Date().toISOString(),
          acknowledged: false
        },
        {
          id: 'insight_2',
          agentId: 'agent_project_1',
          category: 'optimization',
          title: 'Deployment Success Rate Improvement',
          description: 'Automated deployment process achieved 98.7% success rate',
          severity: 'info',
          confidence: 95,
          impact: 'high',
          actionable: false,
          suggestedActions: [],
          data: { success_rate: 98.7, deployments: 156, failures: 2 },
          createdAt: new Date().toISOString(),
          acknowledged: true
        }
      ]
      setInsights(mockInsights)
    } catch (error) {
      console.error('Failed to load insights:', error)
    }
  }

  const startAutonomousOperations = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (autoMode) {
        performAutonomousActions()
      }
    }, 30000) // Run every 30 seconds
  }

  const performAutonomousActions = async () => {
    try {
      // Simulate autonomous AI actions
      const activeAgents = agents.filter(agent => agent.status === 'active')
      
      for (const agent of activeAgents) {
        if (agent.config.autoExecute && Math.random() > 0.7) {
          // Simulate agent performing an action
          const actions = [
            'Optimized database query performance',
            'Updated security configurations',
            'Generated performance report',
            'Cleaned up unused resources',
            'Updated project dependencies',
            'Analyzed user behavior patterns'
          ]
          
          const randomAction = actions[Math.floor(Math.random() * actions.length)]
          
          // Update agent's last action
          setAgents(prev => prev.map(a => 
            a.id === agent.id 
              ? {
                  ...a,
                  lastAction: randomAction,
                  lastActionTime: new Date().toISOString(),
                  tasksCompleted: a.tasksCompleted + 1
                }
              : a
          ))
          
          // Create a new task
          const newTask: AITask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            agentId: agent.id,
            type: 'automation',
            title: randomAction,
            description: `Autonomous action performed by ${agent.name}`,
            priority: 'medium',
            status: 'completed',
            progress: 100,
            estimatedDuration: Math.floor(Math.random() * 30) + 5,
            actualDuration: Math.floor(Math.random() * 25) + 3,
            dependencies: [],
            context: { autonomous: true, agent: agent.name },
            result: { success: true, automated: true },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          setTasks(prev => [newTask, ...prev.slice(0, 49)]) // Keep only 50 most recent tasks
        }
      }
    } catch (error) {
      console.error('Autonomous action failed:', error)
    }
  }

  const createAgent = async (type: string, name: string, description: string, autonomyLevel: AIAgent['autonomyLevel']) => {
    try {
      const agentType = agentTypes.find(at => at.type === type)
      if (!agentType) return
      
      const newAgent: AIAgent = {
        id: `agent_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name,
        description,
        type: type as AIAgent['type'],
        status: 'active',
        capabilities: agentType.capabilities,
        autonomyLevel,
        lastAction: 'Agent initialized',
        lastActionTime: new Date().toISOString(),
        successRate: 0,
        tasksCompleted: 0,
        learningProgress: 0,
        config: {
          autoExecute: autonomyLevel !== 'supervised',
          maxActionsPerHour: 10,
          requireApproval: autonomyLevel === 'supervised',
          learningEnabled: true,
          contextWindow: 500,
          priority: 'medium',
          domains: [type]
        },
        memory: {
          shortTerm: [],
          longTerm: [],
          preferences: {}
        },
        userId: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setAgents(prev => [newAgent, ...prev])
      setSelectedAgent(newAgent)
      toast.success('AI Agent created successfully')
    } catch (error) {
      console.error('Failed to create agent:', error)
      toast.error('Failed to create agent')
    }
  }

  const updateAgent = async (agentId: string, updates: Partial<AIAgent>) => {
    try {
      setAgents(prev => prev.map(agent =>
        agent.id === agentId 
          ? { ...agent, ...updates, updatedAt: new Date().toISOString() }
          : agent
      ))
      
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (error) {
      console.error('Failed to update agent:', error)
    }
  }

  const executeTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'in_progress', progress: 0 }
          : task
      ))
      
      // Simulate task execution
      const progressInterval = setInterval(() => {
        setTasks(prev => prev.map(task => {
          if (task.id === taskId && task.status === 'in_progress') {
            const newProgress = Math.min(task.progress + Math.random() * 20, 100)
            if (newProgress >= 100) {
              clearInterval(progressInterval)
              return {
                ...task,
                status: 'completed',
                progress: 100,
                actualDuration: task.estimatedDuration + Math.floor(Math.random() * 10) - 5,
                result: { success: true, executed: true }
              }
            }
            return { ...task, progress: newProgress }
          }
          return task
        }))
      }, 500)
      
    } catch (error) {
      console.error('Failed to execute task:', error)
    }
  }

  const acknowledgeInsight = (insightId: string) => {
    setInsights(prev => prev.map(insight =>
      insight.id === insightId
        ? { ...insight, acknowledged: true }
        : insight
    ))
  }

  const getAgentIcon = (type: AIAgent['type']) => {
    const agentType = agentTypes.find(at => at.type === type)
    return agentType?.icon || Bot
  }

  const getAgentColor = (type: AIAgent['type']) => {
    const agentType = agentTypes.find(at => at.type === type)
    return agentType?.color || 'bg-gray-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'text-green-500'
      case 'learning': case 'in_progress': return 'text-blue-500'
      case 'error': case 'failed': return 'text-red-500'
      case 'paused': case 'pending': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'learning': case 'in_progress': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'error': case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'paused': case 'pending': return <Pause className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-500 bg-blue-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Autonomous AI Assistant
          </h1>
          <p className="text-muted-foreground">Self-sufficient AI agents managing your dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Auto Mode</span>
            <Switch
              checked={autoMode}
              onCheckedChange={setAutoMode}
            />
          </div>
          <Badge variant={systemStatus === 'optimal' ? 'default' : systemStatus === 'warning' ? 'secondary' : 'destructive'}>
            System {systemStatus}
          </Badge>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create AI Agent</DialogTitle>
              </DialogHeader>
              <AgentCreationForm onSubmit={createAgent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Agents Sidebar */}
        <div className="w-80 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4">AI Agents ({agents.length})</h2>
            <div className="space-y-2">
              {agents.map((agent) => {
                const Icon = getAgentIcon(agent.type)
                return (
                  <Card 
                    key={agent.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedAgent?.id === agent.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded text-white ${getAgentColor(agent.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{agent.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">{agent.type}</p>
                          </div>
                        </div>
                        {getStatusIcon(agent.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Autonomy</span>
                          <Badge variant="outline" className="text-xs">
                            {agent.autonomyLevel.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span>Success Rate</span>
                          <span className="font-medium">{agent.successRate.toFixed(1)}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span>Tasks</span>
                          <span className="font-medium">{agent.tasksCompleted}</span>
                        </div>
                        
                        {agent.learningProgress > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Learning</span>
                              <span>{agent.learningProgress}%</span>
                            </div>
                            <Progress value={agent.learningProgress} className="h-1" />
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          <p className="truncate">{agent.lastAction}</p>
                          <p>{new Date(agent.lastActionTime).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedAgent ? (
            <>
              {/* Agent Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded text-white ${getAgentColor(selectedAgent.type)}`}>
                      {React.createElement(getAgentIcon(selectedAgent.type), { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                      <p className="text-muted-foreground">{selectedAgent.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}>
                      {selectedAgent.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant={selectedAgent.status === 'active' ? 'outline' : 'default'}
                      onClick={() => updateAgent(selectedAgent.id, {
                        status: selectedAgent.status === 'active' ? 'paused' : 'active'
                      })}
                    >
                      {selectedAgent.status === 'active' ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Agent Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="memory">Memory</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="overview" className="p-4 space-y-4">
                    <AgentOverview agent={selectedAgent} tasks={tasks} insights={insights} />
                  </TabsContent>

                  <TabsContent value="tasks" className="p-4">
                    <TasksPanel 
                      tasks={tasks.filter(t => t.agentId === selectedAgent.id)} 
                      onExecuteTask={executeTask}
                    />
                  </TabsContent>

                  <TabsContent value="insights" className="p-4">
                    <InsightsPanel 
                      insights={insights.filter(i => i.agentId === selectedAgent.id)}
                      onAcknowledge={acknowledgeInsight}
                    />
                  </TabsContent>

                  <TabsContent value="memory" className="p-4">
                    <MemoryPanel agent={selectedAgent} />
                  </TabsContent>

                  <TabsContent value="config" className="p-4">
                    <ConfigPanel 
                      agent={selectedAgent} 
                      onUpdate={(updates) => updateAgent(selectedAgent.id, updates)}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Agent Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select an AI agent from the sidebar or create a new one
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Agent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create AI Agent</DialogTitle>
                    </DialogHeader>
                    <AgentCreationForm onSubmit={createAgent} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Agent Creation Form
function AgentCreationForm({ onSubmit }: {
  onSubmit: (type: string, name: string, description: string, autonomyLevel: AIAgent['autonomyLevel']) => void
}) {
  const [type, setType] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [autonomyLevel, setAutonomyLevel] = useState<AIAgent['autonomyLevel']>('semi-autonomous')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !name.trim()) return
    onSubmit(type, name, description, autonomyLevel)
    setType('')
    setName('')
    setDescription('')
    setAutonomyLevel('semi-autonomous')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Agent Type</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select agent type" />
          </SelectTrigger>
          <SelectContent>
            {agentTypes.map((agentType) => {
              const Icon = agentType.icon
              return (
                <SelectItem key={agentType.type} value={agentType.type}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded text-white ${agentType.color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span>{agentType.name}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Agent Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My AI Agent"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this agent does..."
          rows={3}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Autonomy Level</label>
        <Select value={autonomyLevel} onValueChange={(value) => setAutonomyLevel(value as AIAgent['autonomyLevel'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="supervised">Supervised - Requires approval</SelectItem>
            <SelectItem value="semi-autonomous">Semi-Autonomous - Limited independence</SelectItem>
            <SelectItem value="fully-autonomous">Fully Autonomous - Complete independence</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Create Agent
        </Button>
      </div>
    </form>
  )
}

// Agent Overview Component
function AgentOverview({ agent, tasks, insights }: {
  agent: AIAgent
  tasks: AITask[]
  insights: AIInsight[]
}) {
  const agentTasks = tasks.filter(t => t.agentId === agent.id)
  const agentInsights = insights.filter(i => i.agentId === agent.id)
  const recentTasks = agentTasks.slice(0, 5)
  const criticalInsights = agentInsights.filter(i => i.severity === 'critical')

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{agent.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold">{agent.tasksCompleted}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Learning Progress</p>
                <p className="text-2xl font-bold">{agent.learningProgress}%</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">{agentTasks.filter(t => t.status === 'in_progress').length}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((capability, index) => (
              <Badge key={index} variant="outline">
                {capability}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length > 0 ? recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.type}</p>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Critical Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalInsights.length > 0 ? criticalInsights.map((insight) => (
                <div key={insight.id} className="p-2 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-sm text-red-800">{insight.title}</p>
                  <p className="text-xs text-red-600">{insight.description}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No critical insights</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Tasks Panel Component
function TasksPanel({ tasks, onExecuteTask }: {
  tasks: AITask[]
  onExecuteTask: (taskId: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tasks ({tasks.length})</h3>
        <Button size="sm">
          <Plus className="w-3 h-3 mr-1" />
          New Task
        </Button>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                    {task.priority}
                  </Badge>
                  {getStatusIcon(task.status)}
                </div>
              </div>
              
              {task.status === 'in_progress' && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round(task.progress)}%</span>
                  </div>
                  <Progress value={task.progress} />
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{task.type}</span>
                <div className="flex items-center gap-4">
                  <span>Est: {task.estimatedDuration}min</span>
                  {task.actualDuration && <span>Actual: {task.actualDuration}min</span>}
                  {task.status === 'pending' && (
                    <Button size="sm" onClick={() => onExecuteTask(task.id)}>
                      <Play className="w-3 h-3 mr-1" />
                      Execute
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Insights Panel Component
function InsightsPanel({ insights, onAcknowledge }: {
  insights: AIInsight[]
  onAcknowledge: (insightId: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Insights ({insights.length})</h3>
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.id} className={getSeverityColor(insight.severity)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm opacity-80">{insight.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {insight.confidence}% confident
                  </Badge>
                  {!insight.acknowledged && (
                    <Button size="sm" variant="outline" onClick={() => onAcknowledge(insight.id)}>
                      <Eye className="w-3 h-3 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
              
              {insight.suggestedActions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                  <ul className="text-sm space-y-1">
                    {insight.suggestedActions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Memory Panel Component
function MemoryPanel({ agent }: { agent: AIAgent }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Short-term Memory</h3>
        <div className="space-y-3">
          {agent.memory.shortTerm.length > 0 ? agent.memory.shortTerm.map((memory, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="text-sm">
                  <p className="font-medium mb-1">{memory.action}</p>
                  <p className="text-muted-foreground mb-2">{memory.context}</p>
                  <p className="text-green-600">{memory.result}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(memory.timestamp).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-sm text-muted-foreground">No short-term memories</p>
          )}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-4">Long-term Patterns</h3>
        <div className="space-y-3">
          {agent.memory.longTerm.length > 0 ? agent.memory.longTerm.map((pattern, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pattern.pattern}</p>
                    <p className="text-xs text-muted-foreground">{pattern.context}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{pattern.frequency}x</p>
                    <Badge variant={pattern.success ? 'default' : 'destructive'} className="text-xs">
                      {pattern.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-sm text-muted-foreground">No learned patterns</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Config Panel Component
function ConfigPanel({ agent, onUpdate }: {
  agent: AIAgent
  onUpdate: (updates: Partial<AIAgent>) => void
}) {
  const handleConfigChange = (key: string, value: any) => {
    onUpdate({
      config: {
        ...agent.config,
        [key]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Agent Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto Execute</p>
              <p className="text-sm text-muted-foreground">Allow agent to execute tasks automatically</p>
            </div>
            <Switch
              checked={agent.config.autoExecute}
              onCheckedChange={(checked) => handleConfigChange('autoExecute', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require Approval</p>
              <p className="text-sm text-muted-foreground">Require human approval for actions</p>
            </div>
            <Switch
              checked={agent.config.requireApproval}
              onCheckedChange={(checked) => handleConfigChange('requireApproval', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Learning Enabled</p>
              <p className="text-sm text-muted-foreground">Allow agent to learn from actions</p>
            </div>
            <Switch
              checked={agent.config.learningEnabled}
              onCheckedChange={(checked) => handleConfigChange('learningEnabled', checked)}
            />
          </div>
          
          <div>
            <label className="font-medium mb-2 block">Max Actions Per Hour</label>
            <Input
              type="number"
              value={agent.config.maxActionsPerHour}
              onChange={(e) => handleConfigChange('maxActionsPerHour', parseInt(e.target.value))}
              min={1}
              max={100}
            />
          </div>
          
          <div>
            <label className="font-medium mb-2 block">Context Window</label>
            <Input
              type="number"
              value={agent.config.contextWindow}
              onChange={(e) => handleConfigChange('contextWindow', parseInt(e.target.value))}
              min={100}
              max={5000}
            />
          </div>
          
          <div>
            <label className="font-medium mb-2 block">Priority Level</label>
            <Select 
              value={agent.config.priority} 
              onValueChange={(value) => handleConfigChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'border-red-200 bg-red-50'
    case 'warning': return 'border-yellow-200 bg-yellow-50'
    case 'info': return 'border-blue-200 bg-blue-50'
    default: return 'border-gray-200 bg-gray-50'
  }
}