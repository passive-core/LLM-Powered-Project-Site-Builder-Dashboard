import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import {
  Activity, Target, Clock, CheckCircle, AlertTriangle, Plus,
  Edit, Trash2, Play, Pause, BarChart3, TrendingUp, Calendar,
  Users, Zap, Database, Globe, Code, Settings, FileText
} from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface Task {
  id: string
  title: string
  description: string
  category: 'development' | 'integration' | 'testing' | 'deployment' | 'maintenance' | 'research'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
  assignedTo: 'human' | 'ai' | 'system'
  estimatedHours: number
  actualHours?: number
  progress: number
  dependencies: string[]
  tags: string[]
  dueDate?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes: string
  automationLevel: 'manual' | 'semi-auto' | 'full-auto'
  aiAgent?: string
  parentTask?: string
  subtasks: string[]
}

interface ProgressMetrics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  blockedTasks: number
  overdueTasks: number
  completionRate: number
  averageCompletionTime: number
  productivityScore: number
  automationRate: number
}

interface Milestone {
  id: string
  name: string
  description: string
  targetDate: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue'
  progress: number
  tasks: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface WorkSession {
  id: string
  taskId: string
  startTime: string
  endTime?: string
  duration: number
  notes: string
  productivity: number
  interruptions: number
}

const AdvancedTrackingSystem: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'development',
    priority: 'medium',
    status: 'todo',
    assignedTo: 'human',
    estimatedHours: 1,
    progress: 0,
    dependencies: [],
    tags: [],
    notes: '',
    automationLevel: 'manual',
    subtasks: []
  })

  useEffect(() => {
    loadTasks()
    loadMilestones()
    loadWorkSessions()
    calculateMetrics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTasks = async () => {
    try {
      // Load tasks from database
      const taskRecords = await blink.db.tasks?.list() || []
      setTasks(taskRecords)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      loadMockTasks()
    }
  }

  const loadMockTasks = () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Implement Real OAuth Flows',
        description: 'Replace mock OAuth implementation with real OAuth 2.0 flows for all platforms',
        category: 'integration',
        priority: 'critical',
        status: 'in_progress',
        assignedTo: 'human',
        estimatedHours: 40,
        actualHours: 15,
        progress: 35,
        dependencies: ['security-layer'],
        tags: ['oauth', 'security', 'platforms'],
        dueDate: '2024-02-15',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-25T14:30:00Z',
        notes: 'Started with Google OAuth, need to implement token refresh logic',
        automationLevel: 'semi-auto',
        aiAgent: 'integration-specialist',
        subtasks: ['oauth-google', 'oauth-facebook', 'oauth-twitter']
      },
      {
        id: '2',
        title: 'Database Performance Optimization',
        description: 'Add indexes and optimize queries for better performance',
        category: 'development',
        priority: 'high',
        status: 'todo',
        assignedTo: 'ai',
        estimatedHours: 8,
        progress: 0,
        dependencies: [],
        tags: ['database', 'performance', 'optimization'],
        dueDate: '2024-02-10',
        createdAt: '2024-01-22T09:00:00Z',
        updatedAt: '2024-01-22T09:00:00Z',
        notes: 'Focus on frequently queried tables',
        automationLevel: 'full-auto',
        aiAgent: 'database-optimizer',
        subtasks: []
      },
      {
        id: '3',
        title: 'Email API Integration',
        description: 'Integrate with Gmail and Outlook APIs for real-time email monitoring',
        category: 'integration',
        priority: 'high',
        status: 'blocked',
        assignedTo: 'human',
        estimatedHours: 24,
        progress: 10,
        dependencies: ['oauth-flows'],
        tags: ['email', 'api', 'integration'],
        dueDate: '2024-02-20',
        createdAt: '2024-01-18T11:00:00Z',
        updatedAt: '2024-01-24T16:00:00Z',
        notes: 'Blocked by OAuth implementation',
        automationLevel: 'semi-auto',
        subtasks: ['gmail-api', 'outlook-api', 'email-processing']
      },
      {
        id: '4',
        title: 'Security Audit and Implementation',
        description: 'Implement rate limiting, input validation, and audit logging',
        category: 'development',
        priority: 'critical',
        status: 'todo',
        assignedTo: 'human',
        estimatedHours: 16,
        progress: 0,
        dependencies: [],
        tags: ['security', 'audit', 'validation'],
        dueDate: '2024-02-08',
        createdAt: '2024-01-21T13:00:00Z',
        updatedAt: '2024-01-21T13:00:00Z',
        notes: 'Critical for production deployment',
        automationLevel: 'manual',
        subtasks: ['rate-limiting', 'input-validation', 'audit-logging']
      },
      {
        id: '5',
        title: 'Custom Domain Setup',
        description: 'Implement custom domain support with passive-core branding',
        category: 'deployment',
        priority: 'medium',
        status: 'completed',
        assignedTo: 'system',
        estimatedHours: 6,
        actualHours: 5,
        progress: 100,
        dependencies: [],
        tags: ['domain', 'branding', 'dns'],
        dueDate: '2024-01-30',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-28T17:00:00Z',
        completedAt: '2024-01-28T17:00:00Z',
        notes: 'Successfully implemented with SSL certificates',
        automationLevel: 'full-auto',
        subtasks: []
      }
    ]
    setTasks(mockTasks)
  }

  const loadMilestones = () => {
    const mockMilestones: Milestone[] = [
      {
        id: '1',
        name: 'Core Platform Integration',
        description: 'Complete integration with all major platforms',
        targetDate: '2024-02-15',
        status: 'in_progress',
        progress: 45,
        tasks: ['1', '3'],
        priority: 'critical'
      },
      {
        id: '2',
        name: 'Security & Performance',
        description: 'Implement security measures and optimize performance',
        targetDate: '2024-02-10',
        status: 'upcoming',
        progress: 20,
        tasks: ['2', '4'],
        priority: 'high'
      },
      {
        id: '3',
        name: 'Production Ready',
        description: 'System ready for production deployment',
        targetDate: '2024-03-01',
        status: 'upcoming',
        progress: 15,
        tasks: ['1', '2', '3', '4'],
        priority: 'critical'
      }
    ]
    setMilestones(mockMilestones)
  }

  const loadWorkSessions = () => {
    const mockSessions: WorkSession[] = [
      {
        id: '1',
        taskId: '1',
        startTime: '2024-01-25T09:00:00Z',
        endTime: '2024-01-25T12:00:00Z',
        duration: 180,
        notes: 'Implemented Google OAuth flow',
        productivity: 85,
        interruptions: 2
      },
      {
        id: '2',
        taskId: '1',
        startTime: '2024-01-25T14:00:00Z',
        endTime: '2024-01-25T17:30:00Z',
        duration: 210,
        notes: 'Added token refresh logic',
        productivity: 90,
        interruptions: 1
      }
    ]
    setWorkSessions(mockSessions)
  }

  const calculateMetrics = () => {
    // This would be calculated from actual task data
    const mockMetrics: ProgressMetrics = {
      totalTasks: 5,
      completedTasks: 1,
      inProgressTasks: 1,
      blockedTasks: 1,
      overdueTasks: 0,
      completionRate: 20,
      averageCompletionTime: 5.5,
      productivityScore: 87,
      automationRate: 40
    }
    setMetrics(mockMetrics)
  }

  const addTask = async () => {
    if (!newTask.title || !newTask.description) return

    const task: Task = {
      id: `task_${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      category: newTask.category || 'development',
      priority: newTask.priority || 'medium',
      status: 'todo',
      assignedTo: newTask.assignedTo || 'human',
      estimatedHours: newTask.estimatedHours || 1,
      progress: 0,
      dependencies: newTask.dependencies || [],
      tags: newTask.tags || [],
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: newTask.notes || '',
      automationLevel: newTask.automationLevel || 'manual',
      aiAgent: newTask.aiAgent,
      subtasks: []
    }

    try {
      await blink.db.tasks?.create(task)
      setTasks(prev => [...prev, task])
      setNewTask({
        title: '',
        description: '',
        category: 'development',
        priority: 'medium',
        status: 'todo',
        assignedTo: 'human',
        estimatedHours: 1,
        progress: 0,
        dependencies: [],
        tags: [],
        notes: '',
        automationLevel: 'manual',
        subtasks: []
      })
      setIsAddingTask(false)
    } catch (error) {
      console.error('Failed to add task:', error)
      // Add to local state for demo
      setTasks(prev => [...prev, task])
      setIsAddingTask(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status, 
            updatedAt: new Date().toISOString(),
            completedAt: status === 'completed' ? new Date().toISOString() : undefined
          }
        : task
    ))
  }

  const updateTaskProgress = async (taskId: string, progress: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, progress, updatedAt: new Date().toISOString() }
        : task
    ))
  }

  const startWorkSession = (taskId: string) => {
    const session: WorkSession = {
      id: `session_${Date.now()}`,
      taskId,
      startTime: new Date().toISOString(),
      duration: 0,
      notes: '',
      productivity: 0,
      interruptions: 0
    }
    setActiveSession(session)
  }

  const endWorkSession = () => {
    if (!activeSession) return
    
    const endTime = new Date().toISOString()
    const duration = Math.floor((new Date(endTime).getTime() - new Date(activeSession.startTime).getTime()) / 1000 / 60)
    
    const completedSession = {
      ...activeSession,
      endTime,
      duration
    }
    
    setWorkSessions(prev => [...prev, completedSession])
    setActiveSession(null)
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus)
    }

    if (filterAssignee !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === filterAssignee)
    }

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return filtered
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'blocked': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-yellow-500'
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

  const getAssigneeIcon = (assignedTo: string) => {
    switch (assignedTo) {
      case 'ai': return <Zap className="h-4 w-4" />
      case 'system': return <Settings className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const filteredTasks = getFilteredTasks()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Tracking System</h1>
          <p className="text-muted-foreground">Comprehensive task and progress tracking for autonomous operation</p>
        </div>
        <div className="flex items-center space-x-2">
          {activeSession && (
            <Button variant="destructive" onClick={endWorkSession}>
              <Pause className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
          <Button onClick={() => setIsAddingTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-lg font-bold">{metrics.totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold">{metrics.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                  <p className="text-lg font-bold">{metrics.inProgressTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-lg font-bold">{metrics.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Automation</p>
                  <p className="text-lg font-bold">{metrics.automationRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="sessions">Work Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Currently in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {tasks.filter(t => t.status === 'in_progress').map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">{task.category}</Badge>
                            <Badge className={`text-xs ${getPriorityColor(task.priority)} text-white`}>
                              {task.priority}
                            </Badge>
                          </div>
                          <Progress value={task.progress} className="mt-2 h-2" />
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {getAssigneeIcon(task.assignedTo)}
                          {!activeSession && (
                            <Button size="sm" onClick={() => startWorkSession(task.id)}>
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Upcoming Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Milestones</CardTitle>
                <CardDescription>Key deliverables and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {milestones.filter(m => m.status !== 'completed').map(milestone => (
                      <div key={milestone.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{milestone.name}</h4>
                          <Badge className={`text-xs ${getPriorityColor(milestone.priority)} text-white`}>
                            {milestone.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(milestone.targetDate).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-medium">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="mt-1 h-2" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="deployment">Deployment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="human">Human</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTask(task)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge className={`text-xs ${getStatusColor(task.status)} text-white`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)} text-white`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          {getAssigneeIcon(task.assignedTo)}
                          <span className="capitalize">{task.assignedTo}</span>
                        </div>
                        <span>{task.category}</span>
                        <span>{task.estimatedHours}h estimated</span>
                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {task.progress > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-2" />
                        </div>
                      )}
                      <div className="flex items-center space-x-1 mt-2">
                        {task.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {task.status === 'in_progress' && !activeSession && (
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation()
                          startWorkSession(task.id)
                        }}>
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTask(task)
                      }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Milestones</h3>
            <Button onClick={() => setIsAddingMilestone(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
          
          <div className="space-y-4">
            {milestones.map(milestone => (
              <Card key={milestone.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{milestone.name}</h4>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(milestone.priority)} text-white`}>
                        {milestone.priority}
                      </Badge>
                      <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Target Date</p>
                      <p className="font-medium">{new Date(milestone.targetDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Progress</p>
                      <p className="font-medium">{milestone.progress}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                      <p className="font-medium">{milestone.tasks.length} tasks</p>
                    </div>
                  </div>
                  
                  <Progress value={milestone.progress} className="mb-4" />
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Associated Tasks:</p>
                    <div className="flex flex-wrap gap-2">
                      {milestone.tasks.map(taskId => {
                        const task = tasks.find(t => t.id === taskId)
                        return task ? (
                          <Badge key={taskId} variant="outline" className="text-xs">
                            {task.title}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="space-y-4">
            {activeSession && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-800">Active Session</h4>
                      <p className="text-sm text-blue-600">
                        Task: {tasks.find(t => t.id === activeSession.taskId)?.title}
                      </p>
                      <p className="text-xs text-blue-500">
                        Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button variant="destructive" onClick={endWorkSession}>
                      <Pause className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <h3 className="text-lg font-semibold">Work Session History</h3>
            
            <div className="space-y-3">
              {workSessions.map(session => {
                const task = tasks.find(t => t.id === session.taskId)
                return (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{task?.title || 'Unknown Task'}</h4>
                          <p className="text-sm text-muted-foreground">{session.notes}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span>Duration: {session.duration} minutes</span>
                            <span>Productivity: {session.productivity}%</span>
                            <span>Interruptions: {session.interruptions}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{new Date(session.startTime).toLocaleDateString()}</p>
                          <p>{new Date(session.startTime).toLocaleTimeString()} - {session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'Active'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['development', 'integration', 'testing', 'deployment', 'maintenance', 'research'].map(category => {
                    const count = tasks.filter(t => t.category === category).length
                    const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Productivity Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Completion Time</span>
                      <span className="font-bold">{metrics.averageCompletionTime}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Productivity Score</span>
                      <span className="font-bold">{metrics.productivityScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Automation Rate</span>
                      <span className="font-bold">{metrics.automationRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tasks per Day</span>
                      <span className="font-bold">{(metrics.completedTasks / 7).toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task for tracking and management</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Task title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Task description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTask.category} onValueChange={(value: any) => setNewTask({...newTask, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select value={newTask.assignedTo} onValueChange={(value: any) => setNewTask({...newTask, assignedTo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input 
                  id="estimatedHours"
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value) || 1})}
                  min={1}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input 
                id="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                value={newTask.notes}
                onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                Cancel
              </Button>
              <Button onClick={addTask}>
                Add Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvancedTrackingSystem