import React, { useState, useEffect, useCallback } from 'react'
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
import { Checkbox } from './ui/checkbox'
import { 
  User, Bot, Zap, Plus, Filter, Calendar, Clock, 
  CheckCircle, AlertCircle, Play, Pause, RotateCcw,
  Settings, Trash2, Edit3, Copy, Share2, Download,
  Target, TrendingUp, Activity, Brain, Workflow,
  Timer, Flag, Star, Archive, Search, SortAsc
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface TodoItem {
  id: string
  title: string
  description?: string
  category: 'personal' | 'ai_bot' | 'cross_category'
  type: 'task' | 'automation' | 'workflow' | 'reminder'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: 'human' | 'ai' | 'both'
  dueDate?: string
  estimatedTime?: number // in minutes
  actualTime?: number // in minutes
  tags: string[]
  dependencies: string[] // IDs of other todos
  automationConfig?: {
    trigger: 'schedule' | 'event' | 'condition'
    schedule?: string // cron expression
    conditions?: Record<string, any>
    actions: Array<{
      type: 'api_call' | 'notification' | 'data_update' | 'workflow'
      config: Record<string, any>
    }>
  }
  aiInstructions?: string
  progress: number // 0-100
  createdAt: string
  updatedAt: string
  completedAt?: string
  userId: string
  projectId?: string
}

interface TodoTemplate {
  id: string
  name: string
  description: string
  category: 'personal' | 'ai_bot' | 'cross_category'
  items: Omit<TodoItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  tags: string[]
  isPublic: boolean
  usageCount: number
  createdBy: string
}

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: 'todo_status_change' | 'schedule' | 'external_event'
    config: Record<string, any>
  }
  conditions: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }>
  actions: Array<{
    type: 'create_todo' | 'update_todo' | 'send_notification' | 'api_call'
    config: Record<string, any>
  }>
  enabled: boolean
  runCount: number
  lastRun?: string
  userId: string
}

type FilterOptions = {
  category: 'all' | 'personal' | 'ai_bot' | 'cross_category'
  status: 'all' | 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'blocked'
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent'
  assignee: 'all' | 'human' | 'ai' | 'both'
  tags: string[]
}

type SortOptions = 'created' | 'updated' | 'due_date' | 'priority' | 'progress' | 'title'

export default function ComprehensiveTodoSystem() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [templates, setTemplates] = useState<TodoTemplate[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    tags: []
  })
  const [sortBy, setSortBy] = useState<SortOptions>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTodos, setSelectedTodos] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState('todos')
  const [memoryUsage, setMemoryUsage] = useState({
    used: 0,
    total: 1000, // MB
    todos: 0,
    automations: 0,
    cache: 0
  })

  useEffect(() => {
    if (user) {
      loadTodoData()
      startMemoryMonitoring()
    }
  }, [user])

  const loadTodoData = async () => {
    try {
      setIsLoading(true)
      
      // Load todos from database
      const todoData = await blink.db.roadmapItems.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Transform roadmap items to todo format
      const transformedTodos: TodoItem[] = todoData.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: 'personal', // Default category
        type: 'task',
        status: item.status as any || 'todo',
        priority: item.priority as any || 'medium',
        assignee: 'human',
        dueDate: item.dueDate,
        tags: [],
        dependencies: [],
        progress: item.status === 'completed' ? 100 : item.status === 'in_progress' ? 50 : 0,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        userId: item.userId || user?.id || '',
        projectId: item.projectId
      }))
      
      setTodos(transformedTodos)
      
      // Load templates and automation rules
      await Promise.all([
        loadTemplates(),
        loadAutomationRules()
      ])
      
    } catch (error) {
      console.error('Failed to load todo data:', error)
      toast.error('Failed to load todo data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    // Simulate template data
    const mockTemplates: TodoTemplate[] = [
      {
        id: 'template_1',
        name: 'Daily Productivity Workflow',
        description: 'A comprehensive daily workflow combining human tasks and AI automation',
        category: 'cross_category',
        items: [
          {
            title: 'Morning Planning Session',
            category: 'personal',
            type: 'task',
            status: 'todo',
            priority: 'high',
            assignee: 'human',
            estimatedTime: 15,
            tags: ['planning', 'morning'],
            dependencies: [],
            progress: 0
          },
          {
            title: 'AI Content Generation',
            category: 'ai_bot',
            type: 'automation',
            status: 'todo',
            priority: 'medium',
            assignee: 'ai',
            estimatedTime: 30,
            tags: ['content', 'ai'],
            dependencies: [],
            progress: 0,
            automationConfig: {
              trigger: 'schedule',
              schedule: '0 9 * * *',
              actions: [
                {
                  type: 'api_call',
                  config: {
                    endpoint: '/api/generate-content',
                    method: 'POST',
                    data: { type: 'daily_summary' }
                  }
                }
              ]
            }
          }
        ],
        tags: ['productivity', 'daily', 'automation'],
        isPublic: true,
        usageCount: 156,
        createdBy: 'system'
      }
    ]
    
    setTemplates(mockTemplates)
  }

  const loadAutomationRules = async () => {
    // Simulate automation rules
    const mockRules: AutomationRule[] = [
      {
        id: 'rule_1',
        name: 'Auto-complete dependent tasks',
        description: 'Automatically mark dependent tasks as ready when prerequisites are completed',
        trigger: {
          type: 'todo_status_change',
          config: { status: 'completed' }
        },
        conditions: [
          {
            field: 'dependencies',
            operator: 'contains',
            value: 'completed_todo_id'
          }
        ],
        actions: [
          {
            type: 'update_todo',
            config: {
              field: 'status',
              value: 'todo',
              notification: true
            }
          }
        ],
        enabled: true,
        runCount: 23,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: user?.id || ''
      }
    ]
    
    setAutomationRules(mockRules)
  }

  const startMemoryMonitoring = () => {
    const updateMemoryUsage = () => {
      const todosSize = JSON.stringify(todos).length / 1024 / 1024 // MB
      const automationsSize = JSON.stringify(automationRules).length / 1024 / 1024
      const cacheSize = 50 // Simulated cache size
      
      setMemoryUsage({
        used: todosSize + automationsSize + cacheSize,
        total: 1000,
        todos: todosSize,
        automations: automationsSize,
        cache: cacheSize
      })
    }
    
    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }

  const createTodo = async (todoData: Partial<TodoItem>) => {
    if (!user) return
    
    try {
      const newTodo: TodoItem = {
        id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: todoData.title || 'New Todo',
        description: todoData.description,
        category: todoData.category || 'personal',
        type: todoData.type || 'task',
        status: 'todo',
        priority: todoData.priority || 'medium',
        assignee: todoData.assignee || 'human',
        dueDate: todoData.dueDate,
        estimatedTime: todoData.estimatedTime,
        tags: todoData.tags || [],
        dependencies: todoData.dependencies || [],
        automationConfig: todoData.automationConfig,
        aiInstructions: todoData.aiInstructions,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      }
      
      // Save to database
      await blink.db.roadmapItems.create({
        id: newTodo.id,
        title: newTodo.title,
        description: newTodo.description,
        status: newTodo.status,
        priority: newTodo.priority,
        dueDate: newTodo.dueDate,
        projectId: newTodo.projectId || '',
        userId: user.id
      })
      
      setTodos(prev => [newTodo, ...prev])
      toast.success('Todo created successfully!')
      
      // Trigger automation if applicable
      if (newTodo.automationConfig) {
        await triggerAutomation(newTodo)
      }
      
    } catch (error) {
      console.error('Failed to create todo:', error)
      toast.error('Failed to create todo')
    }
  }

  const updateTodo = async (todoId: string, updates: Partial<TodoItem>) => {
    try {
      const updatedTodo = {
        ...updates,
        updatedAt: new Date().toISOString(),
        ...(updates.status === 'completed' && { completedAt: new Date().toISOString() })
      }
      
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, ...updatedTodo } : todo
      ))
      
      // Update in database
      await blink.db.roadmapItems.update(todoId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        dueDate: updates.dueDate
      })
      
      // Check for automation triggers
      await checkAutomationTriggers(todoId, updates)
      
    } catch (error) {
      console.error('Failed to update todo:', error)
      toast.error('Failed to update todo')
    }
  }

  const deleteTodo = async (todoId: string) => {
    try {
      await blink.db.roadmapItems.delete(todoId)
      setTodos(prev => prev.filter(todo => todo.id !== todoId))
      toast.success('Todo deleted')
    } catch (error) {
      console.error('Failed to delete todo:', error)
      toast.error('Failed to delete todo')
    }
  }

  const triggerAutomation = async (todo: TodoItem) => {
    if (!todo.automationConfig) return
    
    try {
      // Execute automation actions
      for (const action of todo.automationConfig.actions) {
        switch (action.type) {
          case 'api_call':
            await blink.data.fetch({
              url: action.config.endpoint,
              method: action.config.method,
              body: action.config.data
            })
            break
          case 'notification':
            await blink.notifications.email({
              to: user?.email || '',
              subject: `Automation: ${todo.title}`,
              html: `<p>Automation task completed: ${todo.title}</p>`
            })
            break
          case 'data_update':
            // Update related data
            break
        }
      }
      
      toast.success(`Automation triggered for: ${todo.title}`)
    } catch (error) {
      console.error('Automation failed:', error)
      toast.error('Automation failed')
    }
  }

  const checkAutomationTriggers = async (todoId: string, updates: Partial<TodoItem>) => {
    const relevantRules = automationRules.filter(rule => 
      rule.enabled && rule.trigger.type === 'todo_status_change'
    )
    
    for (const rule of relevantRules) {
      if (updates.status === rule.trigger.config.status) {
        await executeAutomationRule(rule, todoId)
      }
    }
  }

  const executeAutomationRule = async (rule: AutomationRule, triggeredTodoId: string) => {
    try {
      for (const action of rule.actions) {
        switch (action.type) {
          case 'create_todo': {
            await createTodo(action.config)
            break
          }
          case 'update_todo': {
            // Find and update related todos
            const relatedTodos = todos.filter(todo => 
              todo.dependencies.includes(triggeredTodoId)
            )
            for (const todo of relatedTodos) {
              await updateTodo(todo.id, { status: 'todo' })
            }
            break
          }
          case 'send_notification': {
            await blink.notifications.email({
              to: user?.email || '',
              subject: action.config.subject,
              html: action.config.message
            })
            break
          }
        }
      }
      
      // Update rule stats
      setAutomationRules(prev => prev.map(r => 
        r.id === rule.id 
          ? { ...r, runCount: r.runCount + 1, lastRun: new Date().toISOString() }
          : r
      ))
      
    } catch (error) {
      console.error('Failed to execute automation rule:', error)
    }
  }

  const applyTemplate = async (template: TodoTemplate) => {
    try {
      for (const item of template.items) {
        await createTodo({
          ...item,
          tags: [...item.tags, ...template.tags]
        })
      }
      
      toast.success(`Applied template: ${template.name}`)
    } catch (error) {
      console.error('Failed to apply template:', error)
      toast.error('Failed to apply template')
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    
    const items = Array.from(filteredTodos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    // Update the order in state
    setTodos(prev => {
      const newTodos = [...prev]
      const sourceIndex = newTodos.findIndex(t => t.id === reorderedItem.id)
      const [moved] = newTodos.splice(sourceIndex, 1)
      newTodos.splice(result.destination.index, 0, moved)
      return newTodos
    })
  }

  const filteredTodos = todos.filter(todo => {
    if (filters.category !== 'all' && todo.category !== filters.category) return false
    if (filters.status !== 'all' && todo.status !== filters.status) return false
    if (filters.priority !== 'all' && todo.priority !== filters.priority) return false
    if (filters.assignee !== 'all' && todo.assignee !== filters.assignee) return false
    if (!showCompleted && todo.status === 'completed') return false
    if (filters.tags.length > 0 && !filters.tags.some(tag => todo.tags.includes(tag))) return false
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !todo.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updated': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'due_date': 
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'priority': {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      case 'progress': return b.progress - a.progress
      case 'title': return a.title.localeCompare(b.title)
      default: return 0
    }
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal': return <User className="w-4 h-4" />
      case 'ai_bot': return <Bot className="w-4 h-4" />
      case 'cross_category': return <Zap className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50'
      case 'high': return 'text-orange-500 bg-orange-50'
      case 'medium': return 'text-yellow-500 bg-yellow-50'
      case 'low': return 'text-green-500 bg-green-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'in_progress': return 'text-blue-500'
      case 'blocked': return 'text-red-500'
      case 'cancelled': return 'text-gray-500'
      default: return 'text-yellow-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading todo system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Todo System</h1>
          <p className="text-muted-foreground">Manage personal tasks, AI automations, and cross-category workflows</p>
        </div>
        
        {/* Memory Usage Indicator */}
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-xs text-muted-foreground">
                {memoryUsage.used.toFixed(1)}/{memoryUsage.total} MB
              </span>
            </div>
            <Progress value={(memoryUsage.used / memoryUsage.total) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Todos: {memoryUsage.todos.toFixed(1)}MB</span>
              <span>Auto: {memoryUsage.automations.toFixed(1)}MB</span>
              <span>Cache: {memoryUsage.cache}MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">Todos ({filteredTodos.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="automation">Automation ({automationRules.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search todos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={filters.category} onValueChange={(value: any) => 
                  setFilters(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="ai_bot">AI Bot</SelectItem>
                    <SelectItem value="cross_category">Cross-Category</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.status} onValueChange={(value: any) => 
                  setFilters(prev => ({ ...prev, status: value }))
                }>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                    <SelectItem value="due_date">Due Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
                  <span className="text-sm">Show Completed</span>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Todo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Todo</DialogTitle>
                    </DialogHeader>
                    <TodoForm onSubmit={createTodo} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Todo List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todos">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {filteredTodos.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                        >
                          <TodoCard
                            todo={todo}
                            onUpdate={updateTodo}
                            onDelete={deleteTodo}
                            isSelected={selectedTodos.includes(todo.id)}
                            onSelect={(selected) => {
                              if (selected) {
                                setSelectedTodos(prev => [...prev, todo.id])
                              } else {
                                setSelectedTodos(prev => prev.filter(id => id !== todo.id))
                              }
                            }}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          {filteredTodos.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No todos found</h3>
                <p className="text-muted-foreground mb-4">
                  {todos.length === 0 
                    ? 'Create your first todo to get started'
                    : 'Try adjusting your filters or search query'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Todo Templates</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={template.isPublic ? 'default' : 'secondary'}>
                      {template.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Items</span>
                      <span className="font-medium">{template.items.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Category</span>
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(template.category)}
                        <span className="capitalize">{template.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Used</span>
                      <span className="text-muted-foreground">{template.usageCount} times</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button onClick={() => applyTemplate(template)} className="w-full">
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Automation Rules</h2>
            <Button>
              <Bot className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>
          
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Trigger: {rule.trigger.type}</span>
                          <span>Conditions: {rule.conditions.length}</span>
                          <span>Actions: {rule.actions.length}</span>
                          <span>Runs: {rule.runCount}</span>
                          {rule.lastRun && (
                            <span>Last: {new Date(rule.lastRun).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={rule.enabled} 
                        onCheckedChange={(enabled) => {
                          setAutomationRules(prev => prev.map(r => 
                            r.id === rule.id ? { ...r, enabled } : r
                          ))
                        }}
                      />
                      <Button size="sm" variant="outline">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Todos</p>
                    <p className="text-2xl font-bold">{todos.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">
                      {todos.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">
                      {todos.filter(t => t.status === 'in_progress').length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">
                      {todos.length > 0 
                        ? Math.round((todos.filter(t => t.status === 'completed').length / todos.length) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Todo Card Component
function TodoCard({ todo, onUpdate, onDelete, isSelected, onSelect }: {
  todo: TodoItem
  onUpdate: (id: string, updates: Partial<TodoItem>) => void
  onDelete: (id: string) => void
  isSelected: boolean
  onSelect: (selected: boolean) => void
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal': return <User className="w-4 h-4" />
      case 'ai_bot': return <Bot className="w-4 h-4" />
      case 'cross_category': return <Zap className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50'
      case 'high': return 'text-orange-500 bg-orange-50'
      case 'medium': return 'text-yellow-500 bg-yellow-50'
      case 'low': return 'text-green-500 bg-green-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  return (
    <Card className={`${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{todo.title}</h3>
                <div className={`p-1 rounded ${getPriorityColor(todo.priority)}`}>
                  <Flag className="w-3 h-3" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getCategoryIcon(todo.category)}
                  <span className="text-xs capitalize">{todo.category.replace('_', ' ')}</span>
                </div>
                
                <Badge variant={todo.status === 'completed' ? 'default' : 'secondary'}>
                  {todo.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {todo.description && (
              <p className="text-sm text-muted-foreground mb-3">{todo.description}</p>
            )}
            
            {todo.progress > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{todo.progress}%</span>
                </div>
                <Progress value={todo.progress} className="h-1" />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {todo.assignee === 'ai' && (
                  <div className="flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    <span>AI Task</span>
                  </div>
                )}
                
                {todo.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {todo.estimatedTime && (
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>{todo.estimatedTime}m</span>
                  </div>
                )}
                
                {todo.dependencies.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Workflow className="w-3 h-3" />
                    <span>{todo.dependencies.length} deps</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdate(todo.id, { 
                    status: todo.status === 'completed' ? 'todo' : 'completed',
                    progress: todo.status === 'completed' ? 0 : 100
                  })}
                >
                  {todo.status === 'completed' ? <RotateCcw className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                </Button>
                
                <Button size="sm" variant="outline">
                  <Edit3 className="w-3 h-3" />
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => onDelete(todo.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {todo.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Todo Form Component
function TodoForm({ onSubmit }: {
  onSubmit: (todo: Partial<TodoItem>) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'personal' | 'ai_bot' | 'cross_category'>('personal')
  const [type, setType] = useState<'task' | 'automation' | 'workflow' | 'reminder'>('task')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [assignee, setAssignee] = useState<'human' | 'ai' | 'both'>('human')
  const [dueDate, setDueDate] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [tags, setTags] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    onSubmit({
      title,
      description: description || undefined,
      category,
      type,
      priority,
      assignee,
      dueDate: dueDate || undefined,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      aiInstructions: aiInstructions || undefined
    })

    // Reset form
    setTitle('')
    setDescription('')
    setDueDate('')
    setEstimatedTime('')
    setTags('')
    setAiInstructions('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter todo title..."
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the task..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={(value: any) => setCategory(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="ai_bot">AI Bot</SelectItem>
              <SelectItem value="cross_category">Cross-Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={type} onValueChange={(value: any) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Assignee</label>
          <Select value={assignee} onValueChange={(value: any) => setAssignee(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="human">Human</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Due Date</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Estimated Time (minutes)</label>
          <Input
            type="number"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="60"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="urgent, project-x, automation"
        />
      </div>
      
      {assignee !== 'human' && (
        <div>
          <label className="text-sm font-medium mb-2 block">AI Instructions</label>
          <Textarea
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            placeholder="Specific instructions for AI to complete this task..."
            rows={3}
          />
        </div>
      )}
      
      <Button type="submit" className="w-full">
        Create Todo
      </Button>
    </form>
  )
}