import { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Project } from '../types/project'
import blink from '../blink/client'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated?: (project: Project) => void
}

const projectCategories = [
  'Landing Page',
  'E-commerce',
  'SaaS Dashboard',
  'Portfolio',
  'Blog',
  'Course Platform',
  'Utility App',
  'Marketing Funnel',
  'Other'
]

export function ProjectModal({ isOpen, onClose, onProjectCreated }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    buildIdea: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateProjectPlan = async () => {
    if (!formData.buildIdea.trim()) return
    
    setIsGenerating(true)
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Create a detailed project plan for: "${formData.buildIdea}"
        
        Category: ${formData.category || 'General'}
        
        Please provide:
        1. Project overview and goals
        2. Key features to implement
        3. Technical requirements
        4. Suggested roadmap with 5-7 milestones
        5. Potential challenges and solutions
        
        Format as a structured plan that's actionable and specific.`,
        maxTokens: 1000
      })
      
      setGeneratedContent(text)
      
      // Auto-fill title if empty
      if (!formData.title) {
        const titleMatch = text.match(/(?:Project|Title|Name):\s*([^\n]+)/i)
        if (titleMatch) {
          setFormData(prev => ({ ...prev, title: titleMatch[1].trim() }))
        } else {
          // Generate a title from the build idea
          const words = formData.buildIdea.split(' ').slice(0, 4)
          const generatedTitle = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
          setFormData(prev => ({ ...prev, title: generatedTitle }))
        }
      }
      
    } catch (error) {
      console.error('Failed to generate project plan:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) return
    
    try {
      const user = await blink.auth.me()
      
      const newProject: Omit<Project, 'id'> = {
        title: formData.title,
        description: generatedContent || formData.description,
        status: 'idea',
        category: formData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id,
        healthScore: 100,
        lastHealthCheck: new Date().toISOString(),
        dependencies: [],
        roadmapItems: [],
        generatedAssets: []
      }
      
      const project = await blink.db.projects.create({
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...newProject
      })
      
      onProjectCreated?.(project)
      onClose()
      
      // Reset form
      setFormData({ title: '', description: '', category: '', buildIdea: '' })
      setGeneratedContent(null)
      
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Create New Project</CardTitle>
              <CardDescription>
                Describe your idea and let AI help you plan the perfect project
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Build Idea Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What do you want to build?</label>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="e.g., A modern landing page for my SaaS product with pricing tiers, testimonials, and a contact form"
                  value={formData.buildIdea}
                  onChange={(e) => handleInputChange('buildIdea', e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  type="button"
                  onClick={generateProjectPlan}
                  disabled={!formData.buildIdea.trim() || isGenerating}
                  className="flex-shrink-0"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Generated Content */}
            {generatedContent && (
              <div className="space-y-2">
                <label className="text-sm font-medium">AI-Generated Project Plan</label>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {generatedContent}
                </div>
              </div>
            )}
            
            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Title</label>
                <Input
                  placeholder="My Awesome Project"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select a category</option>
                  {projectCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Manual Description (if no AI content) */}
            {!generatedContent && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="Brief description of your project..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.title.trim()}>
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
