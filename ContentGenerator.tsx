import React, { useState } from 'react'
import { FileText, Code, Mail, Globe, Loader2, Copy, Download, Save } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Textarea } from './ui/Textarea'
import { Input } from './ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface GeneratedContent {
  id: string
  type: 'code' | 'copy' | 'email' | 'landing_page' | 'api_docs'
  title: string
  content: string
  language?: string
  createdAt: string
}

interface ContentGeneratorProps {
  projectId: string
}

const contentTypes = [
  { value: 'code', label: 'Code Scaffolding', icon: Code, description: 'Generate boilerplate code, APIs, functions' },
  { value: 'copy', label: 'Marketing Copy', icon: FileText, description: 'Product descriptions, blog posts, social media' },
  { value: 'email', label: 'Email Templates', icon: Mail, description: 'Welcome emails, newsletters, notifications' },
  { value: 'landing_page', label: 'Landing Page', icon: Globe, description: 'HTML/CSS for landing pages and marketing sites' },
  { value: 'api_docs', label: 'Documentation', icon: FileText, description: 'API docs, user guides, technical documentation' }
]

const codeLanguages = [
  'javascript', 'typescript', 'python', 'html', 'css', 'json', 'sql', 'bash', 'yaml'
]

export function ContentGenerator({ projectId }: ContentGeneratorProps) {
  const [activeType, setActiveType] = useState<string>('code')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [savedContent, setSavedContent] = useState<GeneratedContent[]>([])
  const [contentTitle, setContentTitle] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const { user } = useAuth()

  const generateContent = async () => {
    if (!prompt.trim() || !user) return

    setIsGenerating(true)
    try {
      let systemPrompt = ''
      
      switch (activeType) {
        case 'code':
          systemPrompt = `Generate clean, production-ready ${selectedLanguage} code based on the user's request. Include comments and follow best practices. Format as a complete, runnable code snippet.`
          break
        case 'copy':
          systemPrompt = 'Generate compelling marketing copy that is engaging, persuasive, and professional. Focus on benefits and clear calls-to-action.'
          break
        case 'email':
          systemPrompt = 'Generate a professional email template with proper structure, engaging subject line suggestions, and clear formatting. Include HTML version if appropriate.'
          break
        case 'landing_page':
          systemPrompt = 'Generate a complete HTML landing page with inline CSS styling. Make it modern, responsive, and conversion-focused with clear sections and call-to-action buttons.'
          break
        case 'api_docs':
          systemPrompt = 'Generate comprehensive technical documentation with clear examples, parameter descriptions, and usage instructions. Format in markdown.'
          break
      }

      const { text } = await blink.ai.generateText({
        prompt: `${systemPrompt}\n\nUser Request: ${prompt}\n\nProject Context: This is for project ID ${projectId}. Make the content relevant and professional.`,
        maxTokens: 2000
      })

      const newContent: GeneratedContent = {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: activeType as GeneratedContent['type'],
        title: contentTitle || `Generated ${contentTypes.find(t => t.value === activeType)?.label}`,
        content: text,
        language: activeType === 'code' ? selectedLanguage : undefined,
        createdAt: new Date().toISOString()
      }

      setGeneratedContent(newContent)
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveContent = async () => {
    if (!generatedContent || !user) return

    try {
      // Save to generated_assets table
      await blink.db.generatedAssets.create({
        id: generatedContent.id,
        type: generatedContent.type,
        name: generatedContent.title,
        content: generatedContent.content,
        projectId,
        createdAt: generatedContent.createdAt
      })

      setSavedContent(prev => [generatedContent, ...prev])
      
      // Show success feedback
      alert('Content saved successfully!')
    } catch (error) {
      console.error('Failed to save content:', error)
      alert('Failed to save content. Please try again.')
    }
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      alert('Content copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadContent = (content: GeneratedContent) => {
    const extension = content.type === 'code' ? 
      (content.language === 'html' ? '.html' : 
       content.language === 'css' ? '.css' : 
       content.language === 'python' ? '.py' : 
       content.language === 'sql' ? '.sql' : '.js') :
      content.type === 'landing_page' ? '.html' :
      content.type === 'api_docs' ? '.md' : '.txt'
    
    const blob = new Blob([content.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const currentType = contentTypes.find(t => t.value === activeType)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI Content Generator</h3>
        <p className="text-sm text-muted-foreground">
          Generate code, copy, emails, and documentation with AI assistance
        </p>
      </div>

      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList className="grid w-full grid-cols-5">
          {contentTypes.map((type) => {
            const Icon = type.icon
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {contentTypes.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <type.icon className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Title</label>
                    <Input
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      placeholder={`My ${type.label}`}
                    />
                  </div>
                  {type.value === 'code' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Language</label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {codeLanguages.map(lang => (
                            <SelectItem key={lang} value={lang}>
                              {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Describe what you want to generate</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={getPlaceholderForType(type.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={generateContent}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating {type.label}...
                    </>
                  ) : (
                    <>
                      <type.icon className="h-4 w-4 mr-2" />
                      Generate {type.label}
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {generatedContent && generatedContent.type === type.value && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{type.label}</Badge>
                    <h4 className="font-medium">{generatedContent.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContent(generatedContent)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveContent}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap overflow-x-auto max-h-96">
                    {generatedContent.content}
                  </pre>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {savedContent.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-4">Saved Content</h4>
          <div className="space-y-2">
            {savedContent.map((content) => {
              const type = contentTypes.find(t => t.value === content.type)
              return (
                <div key={content.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {type && <type.icon className="h-4 w-4" />}
                    <span className="font-medium">{content.title}</span>
                    <Badge variant="outline" className="text-xs">{type?.label}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(content.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadContent(content)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function getPlaceholderForType(type: string): string {
  switch (type) {
    case 'code':
      return 'e.g., Create a React component for a user profile card with avatar, name, and bio'
    case 'copy':
      return 'e.g., Write compelling product description for a productivity app that helps teams collaborate'
    case 'email':
      return 'e.g., Create a welcome email for new users signing up for our SaaS platform'
    case 'landing_page':
      return 'e.g., Build a landing page for a AI-powered writing assistant with pricing and testimonials'
    case 'api_docs':
      return 'e.g., Document a REST API for user authentication with login, register, and password reset endpoints'
    default:
      return 'Describe what you want to generate...'
  }
}