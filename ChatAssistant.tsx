import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/Badge'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  projectId?: string
}

interface ChatAssistantProps {
  projectId?: string
  onClose?: () => void
  context?: {
    projects?: any[]
    serviceSummaries?: any[]
    systemHealth?: any
    overallMetrics?: any
  }
  compact?: boolean
}

export function ChatAssistant({ projectId, onClose, context, compact = false }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>(context?.projects || [])
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadProjects = useCallback(async () => {
    if (!user || context?.projects) return
    try {
      const userProjects = await blink.db.projects.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      })
      setProjects(userProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }, [user, context, blink])

  const loadChatHistory = useCallback(async () => {
    if (!user) return
    try {
      const chatHistory = await blink.db.chatMessages.list({
        where: projectId 
          ? { userId: user.id, projectId }
          : { userId: user.id },
        orderBy: { timestamp: 'asc' },
        limit: compact ? 20 : 50
      })
      
      const formattedMessages = chatHistory.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.timestamp),
        projectId: msg.projectId
      }))
      
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [user, projectId, compact, blink])

  useEffect(() => {
    if (!context?.projects) {
      loadChatHistory()
      loadProjects()
    } else {
      loadChatHistory()
    }
  }, [projectId, user, context, loadChatHistory, loadProjects])

  const saveMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!user) return
    try {
      await blink.db.chatMessages.create({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        role,
        timestamp: new Date().toISOString(),
        projectId: projectId || null,
        userId: user.id
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  const generateContextPrompt = () => {
    let contextPrompt = 'You are an AI assistant helping with project management and development. '
    
    // Add project context
    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        contextPrompt += `Current project: "${project.title}" - ${project.description}. Status: ${project.status}. `
        if (project.roadmapItems) {
          const roadmap = JSON.parse(project.roadmapItems || '[]')
          contextPrompt += `Roadmap items: ${roadmap.map((item: any) => `${item.title} (${item.status})`).join(', ')}. `
        }
      }
    } else {
      contextPrompt += `User has ${projects.length} projects: ${projects.map(p => `"${p.title}" (${p.status})`).join(', ')}. `
    }
    
    // Add system context if available
    if (context?.systemHealth) {
      contextPrompt += `System health: Overall ${context.systemHealth.overall}%, Memory ${context.systemHealth.memory}%, Performance ${context.systemHealth.performance}%, ${context.systemHealth.errors} errors. `
    }
    
    // Add service summaries context
    if (context?.serviceSummaries && context.serviceSummaries.length > 0) {
      const healthyServices = context.serviceSummaries.filter((s: any) => s.status === 'healthy').length
      contextPrompt += `AI Services: ${healthyServices}/${context.serviceSummaries.length} healthy. `
      
      const serviceDetails = context.serviceSummaries.map((s: any) => 
        `${s.name}: ${s.status} (${s.healthScore}% health, ${s.metrics.total} total items)`
      ).join(', ')
      contextPrompt += `Service details: ${serviceDetails}. `
    }
    
    // Add overall metrics context
    if (context?.overallMetrics) {
      contextPrompt += `Overall metrics: ${context.overallMetrics.total} total items, ${context.overallMetrics.active} active, ${context.overallMetrics.completed} completed, ${context.overallMetrics.pending} pending. `
    }
    
    contextPrompt += 'Help with project planning, development questions, status updates, system analysis, and suggestions for improvements. Be concise and actionable.'
    return contextPrompt
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
      projectId
    }

    setMessages(prev => [...prev, userMessage])
    await saveMessage(userMessage.content, 'user')
    setInput('')
    setIsLoading(true)

    try {
      const contextPrompt = generateContextPrompt()
      const fullPrompt = `${contextPrompt}\n\nUser question: ${userMessage.content}`
      
      // Use streaming for better UX
      let assistantResponse = ''
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        projectId
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      await blink.ai.streamText(
        {
          prompt: fullPrompt,
          maxTokens: compact ? 500 : 1000
        },
        (chunk) => {
          assistantResponse += chunk
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: assistantResponse }
                : msg
            )
          )
        }
      )
      
      await saveMessage(assistantResponse, 'assistant')
      
    } catch (error) {
      console.error('Failed to get AI response:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        projectId
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const containerClass = compact 
    ? "flex flex-col h-full" 
    : "flex flex-col h-full max-h-[600px]"

  return (
    <Card className={containerClass}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            {projectId ? 'Project Assistant' : 'AI Assistant'}
          </h3>
          {context && (
            <Badge variant="secondary" className="text-xs">
              Context-Aware
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {compact && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <ScrollArea className={`flex-1 p-4 ${compact ? 'max-h-80' : ''}`}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask me anything about your projects!</p>
                  <p className="text-sm mt-2">
                    {context 
                      ? 'I have access to your system data and can provide detailed insights.'
                      : 'I can help with planning, development questions, status updates, and suggestions.'
                    }
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={context ? "Ask about your system..." : "Ask about your projects..."}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}