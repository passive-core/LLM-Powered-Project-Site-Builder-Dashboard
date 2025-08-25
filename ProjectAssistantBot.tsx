import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Lightbulb, Bot, Sparkles, Target, CheckCircle, AlertTriangle, Clock,
  FileText, Globe, Smartphone, Monitor, Database, Code, Palette,
  Users, ShoppingCart, GraduationCap, Briefcase, Heart, Camera,
  Music, Gamepad2, Calculator, Calendar, MessageSquare
} from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  features: string[]
  techStack: string[]
  icon: React.ComponentType<any>
  color: string
  popularity: number
  tags: string[]
}

interface ProjectSuggestion {
  template: ProjectTemplate
  reasoning: string
  customizations: string[]
  confidence: number
}

interface AssistantState {
  step: 'input' | 'analyzing' | 'suggestions' | 'customizing' | 'creating'
  userInput: string
  suggestions: ProjectSuggestion[]
  selectedSuggestion: ProjectSuggestion | null
  customizations: Record<string, string>
  progress: number
}

const projectTemplates: ProjectTemplate[] = [
  {
    id: 'landing-page',
    name: 'Product Landing Page',
    description: 'High-converting landing page with hero section, features, testimonials, and CTA',
    category: 'Marketing',
    difficulty: 'beginner',
    estimatedTime: '2-4 hours',
    features: ['Hero Section', 'Feature Grid', 'Testimonials', 'Pricing', 'Contact Form', 'Newsletter Signup'],
    techStack: ['React', 'Tailwind CSS', 'Framer Motion', 'React Hook Form'],
    icon: Globe,
    color: 'bg-blue-500',
    popularity: 95,
    tags: ['marketing', 'conversion', 'business', 'responsive']
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'Full-featured online store with product catalog, cart, and checkout',
    category: 'E-commerce',
    difficulty: 'advanced',
    estimatedTime: '1-2 weeks',
    features: ['Product Catalog', 'Shopping Cart', 'Checkout', 'User Accounts', 'Order Management', 'Payment Integration'],
    techStack: ['React', 'Stripe', 'Database', 'Authentication', 'Image Optimization'],
    icon: ShoppingCart,
    color: 'bg-green-500',
    popularity: 88,
    tags: ['ecommerce', 'payments', 'inventory', 'users']
  },
  {
    id: 'saas-dashboard',
    name: 'SaaS Dashboard',
    description: 'Modern dashboard with analytics, user management, and subscription handling',
    category: 'Business',
    difficulty: 'advanced',
    estimatedTime: '2-3 weeks',
    features: ['Analytics Charts', 'User Management', 'Billing', 'Settings', 'API Integration', 'Team Collaboration'],
    techStack: ['React', 'Charts.js', 'Stripe', 'Database', 'Authentication'],
    icon: Monitor,
    color: 'bg-purple-500',
    popularity: 92,
    tags: ['saas', 'analytics', 'subscription', 'dashboard']
  },
  {
    id: 'course-platform',
    name: 'Online Course Platform',
    description: 'E-learning platform with course management, video streaming, and progress tracking',
    category: 'Education',
    difficulty: 'advanced',
    estimatedTime: '2-4 weeks',
    features: ['Course Catalog', 'Video Player', 'Progress Tracking', 'Quizzes', 'Certificates', 'Discussion Forums'],
    techStack: ['React', 'Video.js', 'Database', 'Authentication', 'File Storage'],
    icon: GraduationCap,
    color: 'bg-indigo-500',
    popularity: 78,
    tags: ['education', 'video', 'learning', 'certificates']
  },
  {
    id: 'portfolio-website',
    name: 'Portfolio Website',
    description: 'Professional portfolio showcasing work, skills, and experience',
    category: 'Personal',
    difficulty: 'beginner',
    estimatedTime: '1-2 days',
    features: ['About Section', 'Project Gallery', 'Skills Display', 'Contact Form', 'Blog', 'Resume Download'],
    techStack: ['React', 'Tailwind CSS', 'Framer Motion', 'MDX'],
    icon: Briefcase,
    color: 'bg-orange-500',
    popularity: 85,
    tags: ['portfolio', 'personal', 'showcase', 'professional']
  },
  {
    id: 'social-app',
    name: 'Social Media App',
    description: 'Social platform with posts, comments, likes, and user profiles',
    category: 'Social',
    difficulty: 'advanced',
    estimatedTime: '3-4 weeks',
    features: ['User Profiles', 'Posts & Comments', 'Like System', 'Follow/Unfollow', 'Real-time Chat', 'Media Upload'],
    techStack: ['React', 'Real-time Database', 'Authentication', 'File Storage', 'Push Notifications'],
    icon: Users,
    color: 'bg-pink-500',
    popularity: 82,
    tags: ['social', 'realtime', 'chat', 'media']
  },
  {
    id: 'task-manager',
    name: 'Task Management App',
    description: 'Productivity app with task tracking, projects, and team collaboration',
    category: 'Productivity',
    difficulty: 'intermediate',
    estimatedTime: '1-2 weeks',
    features: ['Task Lists', 'Project Organization', 'Due Dates', 'Team Collaboration', 'Progress Tracking', 'Notifications'],
    techStack: ['React', 'Database', 'Authentication', 'Real-time Updates'],
    icon: CheckCircle,
    color: 'bg-cyan-500',
    popularity: 90,
    tags: ['productivity', 'tasks', 'collaboration', 'organization']
  },
  {
    id: 'blog-platform',
    name: 'Blog Platform',
    description: 'Content management system with rich text editor and SEO optimization',
    category: 'Content',
    difficulty: 'intermediate',
    estimatedTime: '1-2 weeks',
    features: ['Rich Text Editor', 'SEO Optimization', 'Categories & Tags', 'Comments', 'Search', 'Analytics'],
    techStack: ['React', 'MDX', 'Database', 'Search Engine', 'Analytics'],
    icon: FileText,
    color: 'bg-emerald-500',
    popularity: 75,
    tags: ['blog', 'content', 'seo', 'writing']
  }
]

export function ProjectAssistantBot() {
  const [state, setState] = useState<AssistantState>({
    step: 'input',
    userInput: '',
    suggestions: [],
    selectedSuggestion: null,
    customizations: {},
    progress: 0
  })
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const analyzeUserInput = async (input: string) => {
    setState(prev => ({ ...prev, step: 'analyzing', progress: 0 }))
    
    try {
      // Simulate analysis progress
      for (let i = 0; i <= 100; i += 10) {
        setState(prev => ({ ...prev, progress: i }))
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Use AI to analyze user input and suggest templates
      const { text } = await blink.ai.generateText({
        prompt: `Analyze this project idea and suggest the 3 most suitable templates from the following options:
        
        User Input: "${input}"
        
        Available Templates:
        ${projectTemplates.map(t => `- ${t.name}: ${t.description} (Category: ${t.category}, Difficulty: ${t.difficulty})`).join('\n')}
        
        For each suggestion, provide:
        1. Template name (exact match from list)
        2. Reasoning (why this template fits)
        3. Suggested customizations (3-5 specific modifications)
        4. Confidence score (0-100)
        
        Respond in JSON format:
        {
          "suggestions": [
            {
              "templateName": "exact template name",
              "reasoning": "why this fits the user's needs",
              "customizations": ["customization 1", "customization 2", "customization 3"],
              "confidence": 85
            }
          ]
        }`,
        maxTokens: 1000
      })
      
      const analysis = JSON.parse(text)
      const suggestions: ProjectSuggestion[] = analysis.suggestions.map((s: any) => {
        const template = projectTemplates.find(t => t.name === s.templateName)
        if (!template) return null
        
        return {
          template,
          reasoning: s.reasoning,
          customizations: s.customizations,
          confidence: s.confidence
        }
      }).filter(Boolean).slice(0, 3)
      
      setState(prev => ({ 
        ...prev, 
        step: 'suggestions', 
        suggestions,
        progress: 100 
      }))
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Failed to analyze your project idea. Please try again.')
      setState(prev => ({ ...prev, step: 'input', progress: 0 }))
    }
  }

  const selectSuggestion = (suggestion: ProjectSuggestion) => {
    setState(prev => ({ 
      ...prev, 
      selectedSuggestion: suggestion,
      step: 'customizing',
      customizations: {
        projectName: '',
        description: '',
        primaryColor: '#3B82F6',
        features: suggestion.customizations.join(', ')
      }
    }))
  }

  const createProject = async () => {
    if (!state.selectedSuggestion || !user) return
    
    setState(prev => ({ ...prev, step: 'creating', progress: 0 }))
    
    try {
      // Simulate project creation progress
      for (let i = 0; i <= 100; i += 20) {
        setState(prev => ({ ...prev, progress: i }))
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      const template = state.selectedSuggestion.template
      const customizations = state.customizations
      
      // Create project in database
      const project = await blink.db.projects.create({
        id: `proj_${Date.now()}`,
        title: customizations.projectName || template.name,
        description: customizations.description || template.description,
        category: template.category,
        status: 'idea',
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        healthScore: 100,
        lastHealthCheck: new Date().toISOString(),
        dependencies: JSON.stringify(template.techStack),
        roadmapItems: JSON.stringify([
          { id: '1', title: 'Setup project structure', status: 'todo', priority: 'high' },
          { id: '2', title: 'Implement core features', status: 'todo', priority: 'high' },
          { id: '3', title: 'Add customizations', status: 'todo', priority: 'medium' },
          { id: '4', title: 'Testing and optimization', status: 'todo', priority: 'medium' },
          { id: '5', title: 'Deploy to production', status: 'todo', priority: 'low' }
        ]),
        generatedAssets: JSON.stringify({
          template: template.name,
          customizations,
          features: template.features,
          techStack: template.techStack,
          assistantGenerated: true
        })
      })
      
      toast.success('Project created successfully!')
      setIsOpen(false)
      
      // Reset state
      setState({
        step: 'input',
        userInput: '',
        suggestions: [],
        selectedSuggestion: null,
        customizations: {},
        progress: 0
      })
      
    } catch (error) {
      console.error('Project creation failed:', error)
      toast.error('Failed to create project. Please try again.')
      setState(prev => ({ ...prev, step: 'customizing', progress: 0 }))
    }
  }

  const resetAssistant = () => {
    setState({
      step: 'input',
      userInput: '',
      suggestions: [],
      selectedSuggestion: null,
      customizations: {},
      progress: 0
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Project Assistant
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Project Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              {['input', 'analyzing', 'suggestions', 'customizing', 'creating'].map((step, index) => {
                const isActive = state.step === step
                const isCompleted = ['input', 'analyzing', 'suggestions', 'customizing', 'creating'].indexOf(state.step) > index
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    {index < 4 && (
                      <div className={`w-12 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Step Content */}
            {state.step === 'input' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Describe Your Project Idea</h3>
                  <p className="text-muted-foreground mb-4">
                    Tell me about the project you want to build. Be as detailed as possible - what's the purpose, who's the target audience, what features do you need?
                  </p>
                </div>
                
                <Textarea
                  placeholder="Example: I want to create a fitness tracking app for runners that includes workout plans, progress tracking, social features to connect with other runners, and integration with wearable devices..."
                  value={state.userInput}
                  onChange={(e) => setState(prev => ({ ...prev, userInput: e.target.value }))}
                  rows={6}
                  className="w-full"
                />
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => analyzeUserInput(state.userInput)}
                    disabled={!state.userInput.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze My Idea
                  </Button>
                </div>
              </div>
            )}
            
            {state.step === 'analyzing' && (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <h3 className="text-lg font-semibold">Analyzing Your Project Idea</h3>
                <p className="text-muted-foreground">
                  I'm analyzing your requirements and finding the best templates that match your vision...
                </p>
                <Progress value={state.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{state.progress}% complete</p>
              </div>
            )}
            
            {state.step === 'suggestions' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recommended Templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Based on your description, here are the best templates that match your project:
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {state.suggestions.map((suggestion, index) => {
                    const Icon = suggestion.template.icon
                    return (
                      <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => selectSuggestion(suggestion)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded text-white ${suggestion.template.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{suggestion.template.name}</h4>
                                <p className="text-sm text-muted-foreground">{suggestion.template.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getDifficultyColor(suggestion.template.difficulty)}>
                                {suggestion.template.difficulty}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {suggestion.confidence}% match
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {suggestion.template.description}
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-2">Why this fits:</p>
                            <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-2">Suggested customizations:</p>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.customizations.map((custom, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {custom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Est. time: {suggestion.template.estimatedTime}</span>
                            <span>{suggestion.template.features.length} features</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetAssistant}>
                    Start Over
                  </Button>
                  <Button variant="outline" disabled>
                    Select a template to continue
                  </Button>
                </div>
              </div>
            )}
            
            {state.step === 'customizing' && state.selectedSuggestion && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customize Your Project</h3>
                  <p className="text-muted-foreground mb-4">
                    Let's personalize your {state.selectedSuggestion.template.name} project:
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Name</label>
                    <Input
                      placeholder={state.selectedSuggestion.template.name}
                      value={state.customizations.projectName}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        customizations: { ...prev.customizations, projectName: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={state.customizations.primaryColor}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          customizations: { ...prev.customizations, primaryColor: e.target.value }
                        }))}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={state.customizations.primaryColor}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          customizations: { ...prev.customizations, primaryColor: e.target.value }
                        }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Description</label>
                  <Textarea
                    placeholder={state.selectedSuggestion.template.description}
                    value={state.customizations.description}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      customizations: { ...prev.customizations, description: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Features</label>
                  <Textarea
                    placeholder="Add any specific features or modifications you want..."
                    value={state.customizations.features}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      customizations: { ...prev.customizations, features: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'suggestions' }))}>
                    Back to Templates
                  </Button>
                  <Button onClick={createProject}>
                    <Target className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              </div>
            )}
            
            {state.step === 'creating' && (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <h3 className="text-lg font-semibold">Creating Your Project</h3>
                <p className="text-muted-foreground">
                  Setting up your project structure and generating initial files...
                </p>
                <Progress value={state.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{state.progress}% complete</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Quick Access Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsOpen(true)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded text-primary">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Project Assistant Bot</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered project suggestions and guidance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default ProjectAssistantBot