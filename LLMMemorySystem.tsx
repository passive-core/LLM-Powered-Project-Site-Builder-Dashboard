import React, { useState, useEffect } from 'react'
import { Brain, Database, Clock, Zap, Settings, RefreshCw, AlertCircle } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface MemorySession {
  id: string
  sessionData: string
  contextSummary: string
  lastInteraction: string
  expiresAt: string
  userId: string
  createdAt: string
}

interface MemoryStats {
  totalSessions: number
  activeSessions: number
  memoryUsage: number
  longestSession: number
  averageSessionLength: number
}

export function LLMMemorySystem() {
  const [memorySessions, setMemorySessions] = useState<MemorySession[]>([])
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    totalSessions: 0,
    activeSessions: 0,
    memoryUsage: 0,
    longestSession: 0,
    averageSessionLength: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [persistentMemory, setPersistentMemory] = useState(true)
  const [autoCleanup, setAutoCleanup] = useState(true)
  const [memoryRetention, setMemoryRetention] = useState(30) // days
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadMemorySessions()
      initializePersistentMemory()
    }
  }, [user])

  const loadMemorySessions = async () => {
    try {
      const sessions = await blink.db.llmMemorySessions.list({
        where: { userId: user.id },
        orderBy: { lastInteraction: 'desc' }
      })
      
      setMemorySessions(sessions)
      calculateMemoryStats(sessions)
    } catch (error) {
      console.error('Failed to load memory sessions:', error)
      toast.error('Failed to load memory data')
    } finally {
      setIsLoading(false)
    }
  }

  const initializePersistentMemory = async () => {
    try {
      // Create or update the main persistent session
      const existingSession = memorySessions.find(s => s.id === 'persistent_main')
      
      if (!existingSession) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + memoryRetention)
        
        await blink.db.llmMemorySessions.create({
          id: 'persistent_main',
          sessionData: JSON.stringify({
            userPreferences: {},
            projectContext: {},
            conversationHistory: [],
            learningData: {}
          }),
          contextSummary: 'Main persistent memory session for long-term context retention',
          lastInteraction: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          userId: user.id,
          createdAt: new Date().toISOString()
        })
        
        toast.success('Persistent LLM memory initialized')
        loadMemorySessions()
      }
    } catch (error) {
      console.error('Failed to initialize persistent memory:', error)
      toast.error('Failed to initialize memory system')
    }
  }

  const calculateMemoryStats = (sessions: MemorySession[]) => {
    const now = new Date()
    const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now)
    
    const sessionLengths = sessions.map(s => {
      const created = new Date(s.createdAt)
      const lastInteraction = new Date(s.lastInteraction)
      return lastInteraction.getTime() - created.getTime()
    })
    
    const totalMemoryUsage = sessions.reduce((acc, session) => {
      return acc + (session.sessionData?.length || 0)
    }, 0)
    
    setMemoryStats({
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      memoryUsage: Math.round(totalMemoryUsage / 1024), // KB
      longestSession: Math.max(...sessionLengths, 0),
      averageSessionLength: sessionLengths.length > 0 ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length : 0
    })
  }

  const refreshMemorySession = async (sessionId: string) => {
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + memoryRetention)
      
      await blink.db.llmMemorySessions.update(sessionId, {
        lastInteraction: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      })
      
      toast.success('Memory session refreshed')
      loadMemorySessions()
    } catch (error) {
      console.error('Failed to refresh memory session:', error)
      toast.error('Failed to refresh memory session')
    }
  }

  const cleanupExpiredSessions = async () => {
    try {
      const now = new Date().toISOString()
      const expiredSessions = memorySessions.filter(s => s.expiresAt < now)
      
      for (const session of expiredSessions) {
        if (session.id !== 'persistent_main') { // Never delete main session
          await blink.db.llmMemorySessions.delete(session.id)
        }
      }
      
      toast.success(`Cleaned up ${expiredSessions.length} expired sessions`)
      loadMemorySessions()
    } catch (error) {
      console.error('Failed to cleanup sessions:', error)
      toast.error('Failed to cleanup expired sessions')
    }
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h`
    return `${hours}h`
  }

  const formatMemorySize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getSessionStatus = (session: MemorySession) => {
    const now = new Date()
    const expires = new Date(session.expiresAt)
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilExpiry < 0) return { status: 'expired', color: 'bg-red-100 text-red-800' }
    if (hoursUntilExpiry < 24) return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'active', color: 'bg-green-100 text-green-800' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading memory system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">LLM Memory System</h2>
          <p className="text-muted-foreground">Persistent memory for long-term context and learning</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={cleanupExpiredSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={initializePersistentMemory}>
            <Brain className="h-4 w-4 mr-2" />
            Refresh Memory
          </Button>
        </div>
      </div>

      {/* Memory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{memoryStats.totalSessions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold">{memoryStats.activeSessions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">{memoryStats.memoryUsage} KB</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Longest Session</p>
              <p className="text-2xl font-bold">{formatDuration(memoryStats.longestSession)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Memory Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Memory Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="persistent-memory">Persistent Memory</Label>
              <p className="text-sm text-muted-foreground">Keep memory active even when you're not using the system</p>
            </div>
            <Switch
              id="persistent-memory"
              checked={persistentMemory}
              onCheckedChange={setPersistentMemory}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-cleanup">Auto Cleanup</Label>
              <p className="text-sm text-muted-foreground">Automatically remove expired memory sessions</p>
            </div>
            <Switch
              id="auto-cleanup"
              checked={autoCleanup}
              onCheckedChange={setAutoCleanup}
            />
          </div>
        </div>
      </Card>

      {/* Memory Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Memory Sessions</h3>
        {memorySessions.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No memory sessions</h3>
            <p className="text-muted-foreground mb-4">
              Memory sessions will be created as you interact with the LLM
            </p>
            <Button onClick={initializePersistentMemory}>
              <Brain className="h-4 w-4 mr-2" />
              Initialize Memory
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {memorySessions.map((session) => {
              const sessionStatus = getSessionStatus(session)
              const sessionSize = session.sessionData?.length || 0
              
              return (
                <Card key={session.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">
                            {session.id === 'persistent_main' ? 'Main Memory Session' : `Session ${session.id.slice(-8)}`}
                          </h4>
                          <Badge className={sessionStatus.color}>
                            {sessionStatus.status}
                          </Badge>
                          {session.id === 'persistent_main' && (
                            <Badge className="bg-blue-100 text-blue-800">Persistent</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{session.contextSummary}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span>Size: {formatMemorySize(sessionSize)}</span>
                          <span>Last: {new Date(session.lastInteraction).toLocaleDateString()}</span>
                          <span>Expires: {new Date(session.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshMemorySession(session.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Memory Health */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Memory Health</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Memory Usage</span>
              <span>{memoryStats.memoryUsage} KB / 1024 KB</span>
            </div>
            <Progress value={(memoryStats.memoryUsage / 1024) * 100} className="h-2" />
          </div>
          
          {persistentMemory && (
            <div className="flex items-center space-x-2 text-green-600">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Persistent memory is active - LLM will remember context across sessions</span>
            </div>
          )}
          
          {memoryStats.memoryUsage > 800 && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Memory usage is high - consider cleaning up old sessions</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default LLMMemorySystem