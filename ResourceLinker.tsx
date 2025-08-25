import React, { useState, useEffect } from 'react'
import { Link, Search, ExternalLink, FileText, Github, BookOpen, Lightbulb, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface Resource {
  id: string
  title: string
  description: string
  url: string
  type: 'documentation' | 'tutorial' | 'code_example' | 'tool' | 'reference' | 'inspiration'
  tags: string[]
  projectId?: string
  userId: string
  createdAt: string
  relevanceScore?: number
}

interface ResourceLinkerProps {
  projectId?: string
  currentTask?: string
}

const resourceTypes = [
  { value: 'documentation', label: 'Documentation', icon: BookOpen, color: 'blue' },
  { value: 'tutorial', label: 'Tutorial', icon: FileText, color: 'green' },
  { value: 'code_example', label: 'Code Example', icon: Github, color: 'purple' },
  { value: 'tool', label: 'Tool', icon: Link, color: 'orange' },
  { value: 'reference', label: 'Reference', icon: ExternalLink, color: 'gray' },
  { value: 'inspiration', label: 'Inspiration', icon: Lightbulb, color: 'yellow' }
]

export function ResourceLinker({ projectId, currentTask }: ResourceLinkerProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [suggestedResources, setSuggestedResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'documentation' as Resource['type'],
    tags: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    loadResources()
    if (currentTask) {
      suggestResources()
    }
  }, [projectId, currentTask, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadResources = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Mock resources for demonstration
      const mockResources: Resource[] = [
        {
          id: 'res_1',
          title: 'React Documentation',
          description: 'Official React documentation with hooks, components, and best practices',
          url: 'https://react.dev',
          type: 'documentation',
          tags: ['react', 'javascript', 'frontend'],
          projectId,
          userId: user.id,
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_2',
          title: 'Tailwind CSS Components',
          description: 'Pre-built Tailwind CSS components and examples',
          url: 'https://tailwindui.com',
          type: 'code_example',
          tags: ['tailwind', 'css', 'components'],
          projectId,
          userId: user.id,
          createdAt: new Date().toISOString()
        },
        {
          id: 'res_3',
          title: 'TypeScript Handbook',
          description: 'Complete guide to TypeScript features and patterns',
          url: 'https://www.typescriptlang.org/docs/',
          type: 'tutorial',
          tags: ['typescript', 'javascript', 'types'],
          projectId,
          userId: user.id,
          createdAt: new Date().toISOString()
        }
      ]
      
      setResources(mockResources)
    } catch (error) {
      console.error('Failed to load resources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const suggestResources = async () => {
    if (!currentTask || !user) return

    setIsSuggesting(true)
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Based on this task: "${currentTask}", suggest 3-5 relevant resources that would be helpful. 

Provide a JSON array with this structure:
[
  {
    "title": "Resource title",
    "description": "Brief description of how this helps with the task",
    "url": "https://example.com",
    "type": "documentation|tutorial|code_example|tool|reference|inspiration",
    "tags": ["tag1", "tag2", "tag3"],
    "relevanceScore": 1-10
  }
]

Focus on practical, actionable resources like official documentation, tutorials, code examples, and tools that directly relate to the task.`,
        maxTokens: 800
      })

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        const formattedSuggestions: Resource[] = suggestions.map((suggestion: any, index: number) => ({
          id: `suggested_${Date.now()}_${index}`,
          title: suggestion.title,
          description: suggestion.description,
          url: suggestion.url,
          type: suggestion.type,
          tags: suggestion.tags || [],
          userId: user.id,
          createdAt: new Date().toISOString(),
          relevanceScore: suggestion.relevanceScore || 5
        }))
        
        setSuggestedResources(formattedSuggestions.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)))
      }
    } catch (error) {
      console.error('Failed to suggest resources:', error)
    } finally {
      setIsSuggesting(false)
    }
  }

  const addResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim() || !formData.url.trim()) return

    try {
      const newResource: Resource = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        description: formData.description,
        url: formData.url,
        type: formData.type,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        projectId,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
      
      setResources(prev => [newResource, ...prev])
      
      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        url: '',
        type: 'documentation',
        tags: ''
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to add resource:', error)
    }
  }

  const addSuggestedResource = (suggested: Resource) => {
    const newResource: Resource = {
      ...suggested,
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId
    }
    
    setResources(prev => [newResource, ...prev])
    setSuggestedResources(prev => prev.filter(r => r.id !== suggested.id))
  }

  const deleteResource = (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    setResources(prev => prev.filter(r => r.id !== resourceId))
  }

  const filteredResources = resources.filter(resource => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      resource.title.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query) ||
      resource.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const getTypeIcon = (type: Resource['type']) => {
    const resourceType = resourceTypes.find(t => t.value === type)
    return resourceType ? resourceType.icon : Link
  }

  const getTypeColor = (type: Resource['type']) => {
    const resourceType = resourceTypes.find(t => t.value === type)
    return resourceType?.color || 'gray'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resource Library</h3>
          <p className="text-sm text-muted-foreground">
            Curated resources and AI-suggested links for your projects
          </p>
        </div>
        <div className="flex gap-2">
          {currentTask && (
            <Button
              variant="outline"
              onClick={suggestResources}
              disabled={isSuggesting}
            >
              {isSuggesting ? 'Suggesting...' : 'AI Suggest'}
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>
              <form onSubmit={addResource} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Resource title"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">URL</label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this resource"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="react, javascript, tutorial"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Resource
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* AI Suggestions */}
      {suggestedResources.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            AI Suggested Resources
            {currentTask && (
              <Badge variant="outline" className="text-xs">
                For: {currentTask.substring(0, 30)}...
              </Badge>
            )}
          </h4>
          <div className="space-y-2">
            {suggestedResources.map((resource) => {
              const Icon = getTypeIcon(resource.type)
              return (
                <div key={resource.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm">{resource.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          {resourceTypes.find(t => t.value === resource.type)?.label}
                        </Badge>
                        {resource.relevanceScore && (
                          <Badge variant="secondary" className="text-xs">
                            {resource.relevanceScore}/10
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {resource.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSuggestedResource(resource)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading resources...
        </div>
      ) : filteredResources.length === 0 ? (
        <Card className="p-8 text-center">
          <Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="font-medium mb-2">
            {searchQuery ? 'No resources match your search' : 'No resources yet'}
          </h4>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Add helpful resources and documentation links for your project'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Resource
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResources.map((resource) => {
            const Icon = getTypeIcon(resource.type)
            return (
              <Card key={resource.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{resource.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {resourceTypes.find(t => t.value === resource.type)?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                      <div className="flex items-center gap-4">
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          Visit Resource
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {resource.tags.length > 0 && (
                          <div className="flex gap-1">
                            {resource.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {resource.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{resource.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteResource(resource.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}