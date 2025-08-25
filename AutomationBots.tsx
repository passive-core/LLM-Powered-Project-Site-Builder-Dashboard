import React, { useState, useEffect, useCallback } from 'react'
import { Bot, Play, Pause, Settings, AlertTriangle, CheckCircle, Clock, Trash2, Plus } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Switch } from './ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface AutomationBot {
  id: string
  name: string
  description: string
  type: 'health_check' | 'task_monitor' | 'notification' | 'data_sync' | 'custom'
  isActive: boolean
  schedule: string // cron-like schedule
  lastRun?: string
  nextRun?: string
  status: 'idle' | 'running' | 'error' | 'success'
  config: Record<string, any>
  projectId?: string
  userId: string
  createdAt: string
}

interface AutomationBotsProps {
  projectId?: string
}

const botTypes = [
  { value: 'health_check', label: 'Health Check', description: 'Monitor project health and dependencies' },
  { value: 'task_monitor', label: 'Task Monitor', description: 'Watch for overdue tasks and blockers' },
  { value: 'notification', label: 'Notification Bot', description: 'Send automated updates and alerts' },
  { value: 'data_sync', label: 'Data Sync', description: 'Keep external systems in sync' },
  { value: 'custom', label: 'Custom Bot', description: 'Custom automation logic' }
]

const scheduleOptions = [
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 9 * * 1', label: 'Weekly on Monday at 9 AM' },
  { value: '0 9 1 * *', label: 'Monthly on 1st at 9 AM' },
  { value: 'custom', label: 'Custom schedule' }
]

export function AutomationBots({ projectId }: AutomationBotsProps) {
  const [bots, setBots] = useState<AutomationBot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<AutomationBot | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'health_check' as AutomationBot['type'],
    schedule: '0 9 * * *',
    customSchedule: '',
    config: {} as Record<string, any>
  })
  const { user } = useAuth()

  const loadBots = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Since we don't have a bots table, we'll simulate with a custom table
      // In a real implementation, you'd create an automation_bots table
      const mockBots: AutomationBot[] = [
        {
          id: 'bot_health_1',
          name: 'Project Health Monitor',
          description: 'Monitors project health score and dependency status',
          type: 'health_check',
          isActive: true,
          schedule: '0 */6 * * *',
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          config: { healthThreshold: 70, alertOnDrop: true },
          projectId,
          userId: user.id,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bot_task_1',
          name: 'Overdue Task Alert',
          description: 'Alerts when tasks are overdue or blocked for too long',
          type: 'task_monitor',
          isActive: true,
          schedule: '0 9 * * *',
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
          status: 'idle',
          config: { overdueThreshold: 3, blockedThreshold: 7 },
          projectId,
          userId: user.id,
          createdAt: new Date().toISOString()
        }
      ]
      
      setBots(projectId ? mockBots.filter(bot => bot.projectId === projectId) : mockBots)
    } catch (error) {
      console.error('Failed to load bots:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, user])

  useEffect(() => {
    loadBots()
  }, [loadBots])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim()) return

    try {
      const schedule = formData.schedule === 'custom' ? formData.customSchedule : formData.schedule
      
      const botData: Omit<AutomationBot, 'id' | 'createdAt'> = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: true,
        schedule,
        status: 'idle',
        config: formData.config,
        projectId,
        userId: user.id
      }

      if (editingBot) {
        // Update existing bot
        const updatedBot = { ...editingBot, ...botData }
        setBots(prev => prev.map(bot => bot.id === editingBot.id ? updatedBot : bot))
      } else {
        // Create new bot
        const newBot: AutomationBot = {
          id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...botData,
          createdAt: new Date().toISOString()
        }
        setBots(prev => [newBot, ...prev])
      }
      
      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        type: 'health_check',
        schedule: '0 9 * * *',
        customSchedule: '',
        config: {}
      })
      setEditingBot(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save bot:', error)
    }
  }

  const toggleBot = async (botId: string) => {
    setBots(prev => prev.map(bot => 
      bot.id === botId ? { ...bot, isActive: !bot.isActive } : bot
    ))
  }

  const runBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (!bot) return

    // Update status to running
    setBots(prev => prev.map(b => 
      b.id === botId ? { ...b, status: 'running' } : b
    ))

    try {
      // Simulate bot execution with AI
      const { text } = await blink.ai.generateText({
        prompt: `Execute automation bot: ${bot.name}\nType: ${bot.type}\nDescription: ${bot.description}\nConfig: ${JSON.stringify(bot.config)}\n\nSimulate running this automation and provide a brief status report of what actions were taken.`,
        maxTokens: 200
      })

      // Update status to success
      setBots(prev => prev.map(b => 
        b.id === botId ? { 
          ...b, 
          status: 'success', 
          lastRun: new Date().toISOString(),
          nextRun: getNextRunTime(b.schedule)
        } : b
      ))

      console.log(`Bot ${bot.name} executed:`, text)
    } catch (error) {
      console.error('Bot execution failed:', error)
      setBots(prev => prev.map(b => 
        b.id === botId ? { ...b, status: 'error' } : b
      ))
    }
  }

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return
    setBots(prev => prev.filter(bot => bot.id !== botId))
  }

  const editBot = (bot: AutomationBot) => {
    setEditingBot(bot)
    setFormData({
      name: bot.name,
      description: bot.description,
      type: bot.type,
      schedule: scheduleOptions.find(opt => opt.value === bot.schedule)?.value || 'custom',
      customSchedule: scheduleOptions.find(opt => opt.value === bot.schedule) ? '' : bot.schedule,
      config: bot.config
    })
    setIsDialogOpen(true)
  }

  const getNextRunTime = (schedule: string): string => {
    // Simple next run calculation (in real app, use a proper cron parser)
    const now = new Date()
    if (schedule.includes('*/6')) {
      return new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString()
    } else if (schedule.includes('9 * * *')) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      return tomorrow.toISOString()
    }
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }

  const getStatusIcon = (status: AutomationBot['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bot className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: AutomationBot['status']) => {
    switch (status) {
      case 'running': return 'secondary'
      case 'success': return 'default'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Automation Bots</h3>
          <p className="text-sm text-muted-foreground">
            Automated monitoring and maintenance for your projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBot(null)
              setFormData({
                name: '',
                description: '',
                type: 'health_check',
                schedule: '0 9 * * *',
                customSchedule: '',
                config: {}
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBot ? 'Edit Bot' : 'Create New Bot'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Bot Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Automation Bot"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bot Type</label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {botTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this bot do?"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Schedule</label>
                <Select value={formData.schedule} onValueChange={(value) => setFormData(prev => ({ ...prev, schedule: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.schedule === 'custom' && (
                  <Input
                    className="mt-2"
                    value={formData.customSchedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, customSchedule: e.target.value }))}
                    placeholder="0 9 * * * (cron format)"
                  />
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingBot ? 'Update Bot' : 'Create Bot'}
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
          Loading bots...
        </div>
      ) : bots.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="font-medium mb-2">No automation bots yet</h4>
          <p className="text-muted-foreground mb-4">
            Create automated bots to monitor and maintain your projects.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Bot
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bots.map((bot) => (
            <Card key={bot.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(bot.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{bot.name}</h4>
                      <Badge variant={getStatusColor(bot.status)} className="text-xs">
                        {bot.status}
                      </Badge>
                      {!bot.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{bot.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Type: {botTypes.find(t => t.value === bot.type)?.label}</span>
                      <span>Schedule: {scheduleOptions.find(s => s.value === bot.schedule)?.label || 'Custom'}</span>
                      {bot.lastRun && (
                        <span>Last run: {new Date(bot.lastRun).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={bot.isActive}
                    onCheckedChange={() => toggleBot(bot.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runBot(bot.id)}
                    disabled={bot.status === 'running' || !bot.isActive}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editBot(bot)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBot(bot.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}