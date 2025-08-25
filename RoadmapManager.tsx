import React, { useState, useEffect } from 'react'
import { Plus, Calendar, CheckCircle, Clock, AlertCircle, Trash2, Edit3 } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  projectId: string
  createdAt: string
}

interface RoadmapManagerProps {
  projectId: string
}

export function RoadmapManager({ projectId }: RoadmapManagerProps) {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    loadRoadmapItems()
  }, [projectId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRoadmapItems = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const items = await blink.db.roadmapItems.list({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      })
      setRoadmapItems(items)
    } catch (error) {
      console.error('Failed to load roadmap items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim()) return

    try {
      if (editingItem) {
        // Update existing item
        await blink.db.roadmapItems.update(editingItem.id, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate || null
        })
        
        setRoadmapItems(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...formData, dueDate: formData.dueDate || undefined }
            : item
        ))
      } else {
        // Create new item
        const newItem: RoadmapItem = {
          id: `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
          projectId,
          createdAt: new Date().toISOString()
        }
        
        await blink.db.roadmapItems.create(newItem)
        setRoadmapItems(prev => [newItem, ...prev])
      }
      
      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: ''
      })
      setEditingItem(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save roadmap item:', error)
    }
  }

  const handleEdit = (item: RoadmapItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this roadmap item?')) return
    
    try {
      await blink.db.roadmapItems.delete(itemId)
      setRoadmapItems(prev => prev.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Failed to delete roadmap item:', error)
    }
  }

  const handleStatusChange = async (itemId: string, newStatus: RoadmapItem['status']) => {
    try {
      await blink.db.roadmapItems.update(itemId, { status: newStatus })
      setRoadmapItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ))
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getStatusIcon = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: RoadmapItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'secondary'
      case 'medium':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in-progress':
        return 'secondary'
      case 'blocked':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const groupedItems = roadmapItems.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = []
    acc[item.status].push(item)
    return acc
  }, {} as Record<string, RoadmapItem[]>)

  const statusOrder = ['todo', 'in-progress', 'completed', 'blocked']
  const statusLabels = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'blocked': 'Blocked'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Roadmap</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingItem(null)
              setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                dueDate: ''
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Task' : 'Add New Task'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
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
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update Task' : 'Add Task'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading roadmap...
        </div>
      ) : roadmapItems.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="font-medium mb-2">No roadmap items yet</h4>
          <p className="text-muted-foreground mb-4">
            Start planning your project by adding tasks and milestones.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Task
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statusOrder.map(status => {
            const items = groupedItems[status] || []
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status as RoadmapItem['status'])}
                  <h4 className="font-medium">{statusLabels[status as keyof typeof statusLabels]}</h4>
                  <Badge variant="outline" className="ml-auto">{items.length}</Badge>
                </div>
                
                <div className="space-y-3">
                  {items.map(item => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-sm leading-tight">{item.title}</h5>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                          {item.priority}
                        </Badge>
                        
                        <Select
                          value={item.status}
                          onValueChange={(value: any) => handleStatusChange(item.id, value)}
                        >
                          <SelectTrigger className="h-6 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {item.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}