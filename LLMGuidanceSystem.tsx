import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, MessageCircle, Navigation, Lightbulb, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'

interface UserAction {
  id: string
  type: 'navigation' | 'click' | 'input' | 'scroll' | 'voice_command'
  element?: string
  page: string
  timestamp: Date
  context: Record<string, any>
}

interface GuidanceMessage {
  id: string
  type: 'suggestion' | 'warning' | 'info' | 'next_step'
  content: string
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: Date;
}

interface LLMGuidanceSystemProps {
  isVisible?: boolean
  onToggle?: () => void
}

export function LLMGuidanceSystem({ isVisible = true, onToggle }: LLMGuidanceSystemProps) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [isActive, setIsActive] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [userActions, setUserActions] = useState<UserAction[]>([])
  const [guidanceMessages, setGuidanceMessages] = useState<GuidanceMessage[]>([])
  const [currentContext, setCurrentContext] = useState<Record<string, any>>({})
  const [voiceInput, setVoiceInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<any>(null)
  const actionQueueRef = useRef<UserAction[]>([])
  const lastAnalysisRef = useRef<Date>(new Date())

  // analyzeUserBehavior - defined early so other effects can use it
  const analyzeUserBehavior = useCallback(async () => {
    if (!user || actionQueueRef.current.length === 0) return

    setIsProcessing(true)
    lastAnalysisRef.current = new Date()

    try {
      const recentActions = actionQueueRef.current.slice(-10)
      actionQueueRef.current = []

      const analysisPrompt = `Analyze the user's recent actions and provide contextual guidance for their LLM-powered project dashboard.

Current Context:
- Page: ${location.pathname}
- User Actions: ${JSON.stringify(recentActions, null, 2)}
- Context: ${JSON.stringify(currentContext, null, 2)}

Return a JSON object with keys: suggestions (array), nextSteps (array), and insights (array). Each suggestion should have: type, content, priority, actionable.
`

      const { text } = await blink.ai.generateText({ prompt: analysisPrompt, maxTokens: 800 })

      try {
        const analysis = JSON.parse(text)
        const newMessages: GuidanceMessage[] = [];

        ;(analysis.suggestions || []).forEach((suggestion: any, index: number) => {
          newMessages.push({
            id: `guidance_${Date.now()}_${index}`,
            type: suggestion.type || 'info',
            content: suggestion.content,
            priority: suggestion.priority || 'medium',
            actionable: suggestion.actionable || false,
            timestamp: new Date()
          })
        })

        ;(analysis.nextSteps || []).forEach((step: string, index: number) => {
          newMessages.push({
            id: `nextstep_${Date.now()}_${index}`,
            type: 'next_step',
            content: step,
            priority: 'high',
            actionable: true,
            timestamp: new Date()
          })
        })

        setGuidanceMessages(prev => [...prev.slice(-5), ...newMessages].slice(-10));

        if (isSpeaking && newMessages.length > 0) {
          const importantMessage = newMessages.find(m => m.priority === 'high') || newMessages[0]
          speakMessage(importantMessage.content)
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        setGuidanceMessages(prev => [...prev, {
          id: `guidance_${Date.now()}`,
          type: 'info',
          content: "I'm observing your workflow and will provide suggestions soon.",
          priority: 'low',
          actionable: false,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Failed to analyze user behavior:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [user, location.pathname, currentContext, isSpeaking, navigate])

  // handleVoiceCommand - defined early for recognition setup
  const handleVoiceCommand = useCallback(async (command: string) => {
    if (!command.trim()) return

    const action: UserAction = {
      id: `voice_${Date.now()}`,
      type: 'voice_command',
      element: 'voice_input',
      page: location.pathname,
      timestamp: new Date(),
      context: { command: command.trim() }
    }

    setUserActions(prev => [...prev.slice(-19), action])

    try {
      const commandPrompt = `User voice command: "${command}"\nCurrent page: ${location.pathname}\nContext: ${JSON.stringify(currentContext, null, 2)}\n
Interpret this command and provide a JSON response with fields: type, response, route (optional), action (optional).`

      const { text } = await blink.ai.generateText({ prompt: commandPrompt, maxTokens: 300 })

      try {
        const commandResponse = JSON.parse(text)

        if (commandResponse.type === 'navigation' && commandResponse.route) {
          navigate(commandResponse.route)
          speakMessage(`Navigating to ${commandResponse.route}`)
        } else {
          speakMessage(commandResponse.response || '')
        }

        setGuidanceMessages(prev => [...prev, {
          id: `voice_response_${Date.now()}`,
          type: 'info',
          content: commandResponse.response || '',
          priority: 'medium',
          actionable: commandResponse.type === 'action',
          timestamp: new Date()
        }])
      } catch (parseError) {
        speakMessage("I heard you, but I'm not sure how to help with that.")
      }
    } catch (error) {
      console.error('Failed to process voice command:', error)
      speakMessage("Sorry, I couldn't process that command.")
    }
  }, [location.pathname, currentContext, navigate])

  // Initialize speech recognition and synthesis
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
          setVoiceInput(transcript)
          if (event.results[event.results.length - 1].isFinal) handleVoiceCommand(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
      }
    } catch (err) {
      // ignore
    }

    if ((window as any).speechSynthesis) synthesisRef.current = (window as any).speechSynthesis
  }, [handleVoiceCommand])

  // Track user actions
  useEffect(() => {
    if (!isActive) return

    const trackAction = (type: UserAction['type'], element?: string, context?: Record<string, any>) => {
      const action: UserAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        element,
        page: location.pathname,
        timestamp: new Date(),
        context: { ...currentContext, ...context }
      }

      setUserActions(prev => [...prev.slice(-19), action])
      actionQueueRef.current.push(action)

      const now = Date.now()
      if (actionQueueRef.current.length >= 5 || now - lastAnalysisRef.current.getTime() > 30000) analyzeUserBehavior()
    }

    trackAction('navigation', location.pathname, { route: location.pathname })

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const element = target.tagName.toLowerCase()
      const text = target.textContent?.slice(0, 50) || ''
      const className = (target.className || '').toString()
      trackAction('click', element, { text, className })
    }

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement
      trackAction('input', target.type, { placeholder: target.placeholder, value: (target.value || '').slice(0, 20) })
    }

    let scrollTimeout: any
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => trackAction('scroll', 'window', { scrollY: window.scrollY, scrollHeight: document.documentElement.scrollHeight }), 500)
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('input', handleInput)
    window.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('input', handleInput)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [isActive, location.pathname, currentContext, analyzeUserBehavior])

  // Update context based on current page
  useEffect(() => {
    const updateContext = async () => {
      const context: Record<string, any> = { page: location.pathname, timestamp: new Date().toISOString() }
      try {
        if (location.pathname === '/') {
          const projects = await blink.db.projects.list({ where: { userId: user?.id }, limit: 10 })
          context.projectCount = projects.length
          context.recentProjects = projects.slice(0, 3).map((p: any) => ({ id: p.id, title: p.title, status: p.status }))
        }
      } catch (err) {
        // ignore
      }
      setCurrentContext(context)
    }
    if (user) updateContext()
  }, [location.pathname, user])

  const speakMessage = (message: string) => {
    if (!synthesisRef.current || !isSpeaking) return
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8
    synthesisRef.current.speak(utterance)
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'next_step': return <Navigation className="w-4 h-4 text-blue-500" />
      case 'warning': return <Eye className="w-4 h-4 text-red-500" />
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-500" />
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />
    }
  }

  if (!isVisible) return null

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[500px] shadow-lg z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            LLM Guidance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} size="sm" />
            {onToggle && (<Button variant="ghost" size="sm" onClick={onToggle}>×</Button>)}
          </div>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={isProcessing ? 'default' : 'secondary'}>{isProcessing ? 'Analyzing...' : 'Watching'}</Badge>
            <span>•</span>
            <span>{userActions.length} actions tracked</span>
          </div>
        )}
      </CardHeader>

      {isActive && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant={isListening ? 'default' : 'outline'} size="sm" onClick={toggleListening} disabled={!recognitionRef.current}>
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {isListening ? 'Listening...' : 'Voice'}
            </Button>

            <Button variant={isSpeaking ? 'default' : 'outline'} size="sm" onClick={() => setIsSpeaking(!isSpeaking)} disabled={!synthesisRef.current}>
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Speech
            </Button>
          </div>

          {isListening && voiceInput && (<div className="p-2 bg-muted rounded text-sm"><strong>Listening:</strong> {voiceInput}</div>)}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {guidanceMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">I'm watching your actions and will provide guidance soon.</p>
              </div>
            ) : (
              guidanceMessages.slice(-5).map((message) => (
                <div key={message.id} className={`p-3 rounded-lg border ${getPriorityColor(message.priority)}`}>
                  <div className="flex items-start gap-2">
                    {getTypeIcon(message.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{message.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button onClick={analyzeUserBehavior} disabled={!(blink as any).features?.llmEnabled || isProcessing} variant="outline" size="sm" className="w-full">
            {isProcessing ? 'Analyzing...' : ((blink as any).features?.llmEnabled ? 'Get Guidance Now' : 'LLM Disabled')}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
