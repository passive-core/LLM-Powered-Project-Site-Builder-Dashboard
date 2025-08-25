import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Bot, Workflow, ArrowRight, ArrowDown, Plus, Settings, Play, Pause,
  Brain, Database, Globe, MessageSquare, FileText, Image, Video,
  Cpu, Network, Code, Sparkles, Target, Filter, Activity, BarChart3,
  Calendar, Users, Shield, Key, RefreshCw, Power, Lightbulb,
  Search, Download, Upload, Share, Bell, Eye, CheckCircle, AlertTriangle,
  Clock, Zap, GitBranch, Mail, Smartphone, Monitor, Server, Cloud
} from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface WorkflowProcess {
  id: string
  name: string
  description: string
  category: 'core' | 'automation' | 'ai' | 'data' | 'user' | 'system'
  status: 'active' | 'needs_help' | 'optimized' | 'manual'
  complexity: 'low' | 'medium' | 'high'
  frequency: 'continuous' | 'hourly' | 'daily' | 'weekly' | 'on-demand'
  currentBots: string[]
  suggestedBots: string[]
  dependencies: string[]
  outputs: string[]
  metrics: {
    efficiency: number
    automation: number
    errorRate: number
    userSatisfaction: number
  }
  icon: React.ComponentType<any>
  color: string
  position: { x: number; y: number }
}

interface HelperBot {
  id: string
  name: string
  type: 'monitor' | 'optimizer' | 'assistant' | 'automator' | 'analyzer' | 'guardian'
  description: string
  capabilities: string[]
  targetProcesses: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedImpact: {
    efficiency: number
    automation: number
    errorReduction: number
    timesSaved: number
  }
  implementation: {
    complexity: 'simple' | 'moderate' | 'complex'
    timeEstimate: string
    dependencies: string[]
  }
  icon: React.ComponentType<any>
  color: string
}

const workflowProcesses: WorkflowProcess[] = [
  {
    id: 'project-creation',
    name: 'Project Creation',
    description: 'User creates new projects via dashboard or AI builder',
    category: 'core',
    status: 'needs_help',
    complexity: 'medium',
    frequency: 'on-demand',
    currentBots: [],
    suggestedBots: ['project-assistant', 'template-suggester'],
    dependencies: [],
    outputs: ['project-management', 'content-generation'],
    metrics: { efficiency: 65, automation: 30, errorRate: 15, userSatisfaction: 75 },
    icon: Plus,
    color: 'bg-blue-500',
    position: { x: 100, y: 100 }
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Tracking project status, health checks, and roadmap updates',
    category: 'core',
    status: 'active',
    complexity: 'high',
    frequency: 'continuous',
    currentBots: ['health-monitor', 'dependency-tracker'],
    suggestedBots: ['roadmap-optimizer', 'resource-allocator'],
    dependencies: ['project-creation'],
    outputs: ['dashboard-updates', 'notifications'],
    metrics: { efficiency: 80, automation: 70, errorRate: 8, userSatisfaction: 85 },
    icon: BarChart3,
    color: 'bg-green-500',
    position: { x: 400, y: 100 }
  },
  {
    id: 'content-generation',
    name: 'Content Generation',
    description: 'AI-powered content creation for projects and marketing',
    category: 'ai',
    status: 'optimized',
    complexity: 'high',
    frequency: 'on-demand',
    currentBots: ['content-creator', 'seo-optimizer'],
    suggestedBots: ['brand-consistency-checker', 'multi-format-generator'],
    dependencies: ['project-creation'],
    outputs: ['asset-storage', 'social-publishing'],
    metrics: { efficiency: 90, automation: 85, errorRate: 5, userSatisfaction: 92 },
    icon: FileText,
    color: 'bg-purple-500',
    position: { x: 700, y: 100 }
  },
  {
    id: 'dashboard-updates',
    name: 'Dashboard Updates',
    description: 'Real-time dashboard data refresh and UI optimization',
    category: 'system',
    status: 'needs_help',
    complexity: 'medium',
    frequency: 'continuous',
    currentBots: ['performance-monitor'],
    suggestedBots: ['ui-optimizer', 'data-refresher', 'layout-adjuster'],
    dependencies: ['project-management', 'user-analytics'],
    outputs: ['user-experience'],
    metrics: { efficiency: 70, automation: 60, errorRate: 12, userSatisfaction: 78 },
    icon: Monitor,
    color: 'bg-orange-500',
    position: { x: 400, y: 300 }
  },
  {
    id: 'user-analytics',
    name: 'User Analytics',
    description: 'Tracking user behavior, preferences, and engagement',
    category: 'data',
    status: 'manual',
    complexity: 'high',
    frequency: 'continuous',
    currentBots: [],
    suggestedBots: ['behavior-analyzer', 'insight-generator', 'trend-predictor'],
    dependencies: ['user-interactions'],
    outputs: ['dashboard-updates', 'personalization'],
    metrics: { efficiency: 45, automation: 20, errorRate: 25, userSatisfaction: 60 },
    icon: Activity,
    color: 'bg-red-500',
    position: { x: 100, y: 300 }
  },
  {
    id: 'automation-management',
    name: 'Automation Management',
    description: 'Managing and orchestrating all automation bots',
    category: 'automation',
    status: 'active',
    complexity: 'high',
    frequency: 'continuous',
    currentBots: ['bot-orchestrator', 'sequential-queue'],
    suggestedBots: ['conflict-resolver', 'performance-optimizer', 'auto-scaler'],
    dependencies: ['all-processes'],
    outputs: ['system-efficiency'],
    metrics: { efficiency: 75, automation: 80, errorRate: 10, userSatisfaction: 82 },
    icon: Bot,
    color: 'bg-indigo-500',
    position: { x: 700, y: 300 }
  },
  {
    id: 'asset-storage',
    name: 'Asset Storage',
    description: 'Managing generated assets, files, and media',
    category: 'data',
    status: 'needs_help',
    complexity: 'medium',
    frequency: 'continuous',
    currentBots: [],
    suggestedBots: ['storage-optimizer', 'duplicate-detector', 'backup-manager'],
    dependencies: ['content-generation'],
    outputs: ['project-assets'],
    metrics: { efficiency: 60, automation: 40, errorRate: 18, userSatisfaction: 70 },
    icon: Database,
    color: 'bg-cyan-500',
    position: { x: 700, y: 500 }
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'System alerts, user notifications, and communication',
    category: 'user',
    status: 'needs_help',
    complexity: 'medium',
    frequency: 'continuous',
    currentBots: [],
    suggestedBots: ['smart-notifier', 'priority-manager', 'channel-optimizer'],
    dependencies: ['project-management', 'user-analytics'],
    outputs: ['user-engagement'],
    metrics: { efficiency: 55, automation: 35, errorRate: 20, userSatisfaction: 65 },
    icon: Bell,
    color: 'bg-yellow-500',
    position: { x: 400, y: 500 }
  },
  {
    id: 'security-monitoring',
    name: 'Security Monitoring',
    description: 'Monitoring security threats and access control',
    category: 'system',
    status: 'manual',
    complexity: 'high',
    frequency: 'continuous',
    currentBots: [],
    suggestedBots: ['threat-detector', 'access-guardian', 'compliance-checker'],
    dependencies: ['all-processes'],
    outputs: ['system-security'],
    metrics: { efficiency: 40, automation: 15, errorRate: 30, userSatisfaction: 55 },
    icon: Shield,
    color: 'bg-red-600',
    position: { x: 100, y: 500 }
  }
]

const suggestedHelperBots: HelperBot[] = [
  {
    id: 'project-assistant',
    name: 'Project Assistant Bot',
    type: 'assistant',
    description: 'Guides users through project creation with smart suggestions',
    capabilities: ['Template recommendation', 'Requirement analysis', 'Best practice guidance'],
    targetProcesses: ['project-creation'],
    priority: 'high',
    estimatedImpact: { efficiency: 40, automation: 50, errorReduction: 60, timesSaved: 30 },
    implementation: { complexity: 'moderate', timeEstimate: '2-3 days', dependencies: ['AI integration'] },
    icon: Lightbulb,
    color: 'bg-blue-500'
  },
  {
    id: 'behavior-analyzer',
    name: 'User Behavior Analyzer',
    type: 'analyzer',
    description: 'Analyzes user patterns and generates actionable insights',
    capabilities: ['Pattern recognition', 'Trend analysis', 'Predictive modeling'],
    targetProcesses: ['user-analytics'],
    priority: 'critical',
    estimatedImpact: { efficiency: 70, automation: 80, errorReduction: 50, timesSaved: 60 },
    implementation: { complexity: 'complex', timeEstimate: '1-2 weeks', dependencies: ['Analytics setup', 'ML models'] },
    icon: Brain,
    color: 'bg-purple-500'
  },
  {
    id: 'ui-optimizer',
    name: 'UI Optimization Bot',
    type: 'optimizer',
    description: 'Continuously optimizes dashboard layout and performance',
    capabilities: ['Layout optimization', 'Performance tuning', 'A/B testing'],
    targetProcesses: ['dashboard-updates'],
    priority: 'high',
    estimatedImpact: { efficiency: 50, automation: 60, errorReduction: 40, timesSaved: 45 },
    implementation: { complexity: 'moderate', timeEstimate: '1 week', dependencies: ['Performance metrics'] },
    icon: Zap,
    color: 'bg-orange-500'
  },
  {
    id: 'smart-notifier',
    name: 'Smart Notification Bot',
    type: 'assistant',
    description: 'Intelligently manages and prioritizes notifications',
    capabilities: ['Priority scoring', 'Channel selection', 'Timing optimization'],
    targetProcesses: ['notifications'],
    priority: 'medium',
    estimatedImpact: { efficiency: 45, automation: 70, errorReduction: 55, timesSaved: 35 },
    implementation: { complexity: 'simple', timeEstimate: '3-5 days', dependencies: ['Notification system'] },
    icon: MessageSquare,
    color: 'bg-yellow-500'
  },
  {
    id: 'threat-detector',
    name: 'Security Threat Detector',
    type: 'guardian',
    description: 'Monitors and responds to security threats in real-time',
    capabilities: ['Anomaly detection', 'Threat assessment', 'Automated response'],
    targetProcesses: ['security-monitoring'],
    priority: 'critical',
    estimatedImpact: { efficiency: 80, automation: 90, errorReduction: 85, timesSaved: 70 },
    implementation: { complexity: 'complex', timeEstimate: '2-3 weeks', dependencies: ['Security framework', 'ML models'] },
    icon: Shield,
    color: 'bg-red-600'
  },
  {
    id: 'storage-optimizer',
    name: 'Storage Optimization Bot',
    type: 'optimizer',
    description: 'Optimizes asset storage and manages file lifecycle',
    capabilities: ['Duplicate detection', 'Compression', 'Lifecycle management'],
    targetProcesses: ['asset-storage'],
    priority: 'medium',
    estimatedImpact: { efficiency: 60, automation: 75, errorReduction: 45, timesSaved: 50 },
    implementation: { complexity: 'moderate', timeEstimate: '1 week', dependencies: ['Storage API'] },
    icon: Database,
    color: 'bg-cyan-500'
  }
]

export function WorkflowChart() {
  const [selectedProcess, setSelectedProcess] = useState<WorkflowProcess | null>(null)
  const [selectedBot, setSelectedBot] = useState<HelperBot | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'bots'>('overview')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const { user } = useAuth()

  const filteredProcesses = workflowProcesses.filter(process => 
    filterCategory === 'all' || process.category === filterCategory
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimized': return 'bg-green-100 text-green-800 border-green-200'
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'needs_help': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'manual': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const calculateOverallMetrics = () => {
    const totalProcesses = workflowProcesses.length
    const optimizedProcesses = workflowProcesses.filter(p => p.status === 'optimized').length
    const needsHelpProcesses = workflowProcesses.filter(p => p.status === 'needs_help').length
    const manualProcesses = workflowProcesses.filter(p => p.status === 'manual').length
    
    const avgEfficiency = workflowProcesses.reduce((sum, p) => sum + p.metrics.efficiency, 0) / totalProcesses
    const avgAutomation = workflowProcesses.reduce((sum, p) => sum + p.metrics.automation, 0) / totalProcesses
    const avgErrorRate = workflowProcesses.reduce((sum, p) => sum + p.metrics.errorRate, 0) / totalProcesses
    const avgSatisfaction = workflowProcesses.reduce((sum, p) => sum + p.metrics.userSatisfaction, 0) / totalProcesses

    return {
      totalProcesses,
      optimizedProcesses,
      needsHelpProcesses,
      manualProcesses,
      avgEfficiency: Math.round(avgEfficiency),
      avgAutomation: Math.round(avgAutomation),
      avgErrorRate: Math.round(avgErrorRate),
      avgSatisfaction: Math.round(avgSatisfaction)
    }
  }

  const metrics = calculateOverallMetrics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="w-6 h-6 text-primary" />
            Workflow Analysis & Bot Integration
          </h2>
          <p className="text-muted-foreground">
            Visual map of all processes and recommended helper bots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Categories</option>
            <option value="core">Core Processes</option>
            <option value="automation">Automation</option>
            <option value="ai">AI Processes</option>
            <option value="data">Data Management</option>
            <option value="user">User Experience</option>
            <option value="system">System Operations</option>
          </select>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Processes</p>
                <p className="text-2xl font-bold">{metrics.totalProcesses}</p>
              </div>
              <Workflow className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                <p className="text-2xl font-bold">{metrics.avgEfficiency}%</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automation Level</p>
                <p className="text-2xl font-bold">{metrics.avgAutomation}%</p>
              </div>
              <Bot className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Help</p>
                <p className="text-2xl font-bold">{metrics.needsHelpProcesses}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="overview">Process Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="bots">Suggested Bots</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Process Flow Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Process Flow Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 rounded-lg p-6 min-h-[600px] overflow-auto">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Connection Lines */}
                <svg className="absolute inset-0 pointer-events-none">
                  {filteredProcesses.map(process => 
                    process.outputs.map(outputId => {
                      const targetProcess = filteredProcesses.find(p => p.id === outputId)
                      if (!targetProcess) return null

                      const fromX = process.position.x + 150
                      const fromY = process.position.y + 40
                      const toX = targetProcess.position.x
                      const toY = targetProcess.position.y + 40

                      return (
                        <line
                          key={`${process.id}-${outputId}`}
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke="#6b7280"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      )
                    })
                  )}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                    </marker>
                  </defs>
                </svg>

                {/* Process Nodes */}
                {filteredProcesses.map((process) => {
                  const Icon = process.icon
                  return (
                    <div
                      key={process.id}
                      className={`absolute w-72 bg-white border-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${
                        selectedProcess?.id === process.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                      }`}
                      style={{
                        left: process.position.x,
                        top: process.position.y
                      }}
                      onClick={() => setSelectedProcess(process)}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded text-white ${process.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{process.name}</h4>
                            <p className="text-xs text-muted-foreground">{process.category}</p>
                          </div>
                          <Badge className={getStatusColor(process.status)}>
                            {process.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{process.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Efficiency:</span>
                            <div className="flex items-center gap-1">
                              <Progress value={process.metrics.efficiency} className="h-1 flex-1" />
                              <span className="font-medium">{process.metrics.efficiency}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Automation:</span>
                            <div className="flex items-center gap-1">
                              <Progress value={process.metrics.automation} className="h-1 flex-1" />
                              <span className="font-medium">{process.metrics.automation}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {process.suggestedBots.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Bot className="w-3 h-3" />
                              <span>{process.suggestedBots.length} suggested bot{process.suggestedBots.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-4">
            {filteredProcesses.map((process) => {
              const Icon = process.icon
              return (
                <Card key={process.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedProcess(process)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded text-white ${process.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{process.name}</h3>
                          <p className="text-sm text-muted-foreground">{process.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(process.status)}>
                          {process.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getComplexityColor(process.complexity)}>
                          {process.complexity} complexity
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Efficiency</p>
                        <div className="flex items-center gap-2">
                          <Progress value={process.metrics.efficiency} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{process.metrics.efficiency}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Automation</p>
                        <div className="flex items-center gap-2">
                          <Progress value={process.metrics.automation} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{process.metrics.automation}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Error Rate</p>
                        <div className="flex items-center gap-2">
                          <Progress value={100 - process.metrics.errorRate} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{process.metrics.errorRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">User Satisfaction</p>
                        <div className="flex items-center gap-2">
                          <Progress value={process.metrics.userSatisfaction} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{process.metrics.userSatisfaction}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Frequency: {process.frequency}</span>
                        <span className="text-muted-foreground">Category: {process.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {process.currentBots.length > 0 && (
                          <Badge variant="outline">
                            {process.currentBots.length} active bot{process.currentBots.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {process.suggestedBots.length > 0 && (
                          <Badge variant="secondary">
                            {process.suggestedBots.length} suggested bot{process.suggestedBots.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="bots" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {suggestedHelperBots.map((bot) => {
              const Icon = bot.icon
              return (
                <Card key={bot.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedBot(bot)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded text-white ${bot.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{bot.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{bot.type} bot</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(bot.priority)}`} title={`${bot.priority} priority`} />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{bot.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Capabilities</p>
                        <div className="flex flex-wrap gap-1">
                          {bot.capabilities.map((capability, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium mb-1">Estimated Impact</p>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Efficiency:</span>
                              <span className="font-medium">+{bot.estimatedImpact.efficiency}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Automation:</span>
                              <span className="font-medium">+{bot.estimatedImpact.automation}%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Implementation</p>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Complexity:</span>
                              <span className={`font-medium capitalize ${getComplexityColor(bot.implementation.complexity)}`}>
                                {bot.implementation.complexity}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium">{bot.implementation.timeEstimate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Target Processes:</p>
                        <div className="flex flex-wrap gap-1">
                          {bot.targetProcesses.map((processId, index) => {
                            const process = workflowProcesses.find(p => p.id === processId)
                            return process ? (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {process.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Process/Bot Details Modal */}
      {(selectedProcess || selectedBot) && (
        <Dialog open={true} onOpenChange={() => { setSelectedProcess(null); setSelectedBot(null) }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProcess ? `${selectedProcess.name} - Process Details` : `${selectedBot?.name} - Bot Details`}
              </DialogTitle>
            </DialogHeader>
            
            {selectedProcess && (
              <ProcessDetailsModal process={selectedProcess} suggestedBots={suggestedHelperBots} />
            )}
            
            {selectedBot && (
              <BotDetailsModal bot={selectedBot} targetProcesses={workflowProcesses} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Process Details Modal Component
function ProcessDetailsModal({ process, suggestedBots }: {
  process: WorkflowProcess
  suggestedBots: HelperBot[]
}) {
  const Icon = process.icon
  const relevantBots = suggestedBots.filter(bot => 
    bot.targetProcesses.includes(process.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded text-white ${process.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{process.name}</h3>
          <p className="text-muted-foreground">{process.description}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Current Metrics</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Efficiency</span>
                <span className="text-sm font-medium">{process.metrics.efficiency}%</span>
              </div>
              <Progress value={process.metrics.efficiency} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Automation</span>
                <span className="text-sm font-medium">{process.metrics.automation}%</span>
              </div>
              <Progress value={process.metrics.automation} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Error Rate</span>
                <span className="text-sm font-medium">{process.metrics.errorRate}%</span>
              </div>
              <Progress value={100 - process.metrics.errorRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">User Satisfaction</span>
                <span className="text-sm font-medium">{process.metrics.userSatisfaction}%</span>
              </div>
              <Progress value={process.metrics.userSatisfaction} className="h-2" />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Process Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium capitalize">{process.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={getStatusColor(process.status)}>
                {process.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complexity:</span>
              <span className="font-medium capitalize">{process.complexity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frequency:</span>
              <span className="font-medium">{process.frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Bots:</span>
              <span className="font-medium">{process.currentBots.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {relevantBots.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Recommended Helper Bots</h4>
          <div className="grid gap-3">
            {relevantBots.map((bot) => {
              const BotIcon = bot.icon
              return (
                <div key={bot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded text-white ${bot.color}`}>
                      <BotIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-medium">{bot.name}</h5>
                      <p className="text-sm text-muted-foreground">{bot.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getPriorityColor(bot.priority)} text-white`}>
                      {bot.priority}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bot.implementation.timeEstimate}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Bot Details Modal Component
function BotDetailsModal({ bot, targetProcesses }: {
  bot: HelperBot
  targetProcesses: WorkflowProcess[]
}) {
  const Icon = bot.icon
  const processes = targetProcesses.filter(process => 
    bot.targetProcesses.includes(process.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded text-white ${bot.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{bot.name}</h3>
          <p className="text-muted-foreground capitalize">{bot.type} bot - {bot.priority} priority</p>
        </div>
      </div>
      
      <p className="text-muted-foreground">{bot.description}</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Estimated Impact</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Efficiency Improvement</span>
              <span className="font-medium text-green-600">+{bot.estimatedImpact.efficiency}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Automation Increase</span>
              <span className="font-medium text-blue-600">+{bot.estimatedImpact.automation}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Error Reduction</span>
              <span className="font-medium text-purple-600">-{bot.estimatedImpact.errorReduction}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Time Saved</span>
              <span className="font-medium text-orange-600">{bot.estimatedImpact.timesSaved}%</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Implementation Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complexity:</span>
              <span className="font-medium capitalize">{bot.implementation.complexity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Estimate:</span>
              <span className="font-medium">{bot.implementation.timeEstimate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dependencies:</span>
              <div className="mt-1">
                {bot.implementation.dependencies.map((dep, index) => (
                  <Badge key={index} variant="outline" className="text-xs mr-1">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          {bot.capabilities.map((capability, index) => (
            <Badge key={index} variant="secondary">
              {capability}
            </Badge>
          ))}
        </div>
      </div>
      
      {processes.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Target Processes</h4>
          <div className="grid gap-3">
            {processes.map((process) => {
              const ProcessIcon = process.icon
              return (
                <div key={process.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded text-white ${process.color}`}>
                      <ProcessIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-medium">{process.name}</h5>
                      <p className="text-sm text-muted-foreground">{process.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(process.status)}>
                    {process.status.replace('_', ' ')}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'optimized': return 'bg-green-100 text-green-800 border-green-200'
    case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'needs_help': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'manual': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default WorkflowChart