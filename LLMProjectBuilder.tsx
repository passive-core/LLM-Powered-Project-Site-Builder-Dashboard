import React, { useState, useCallback, useEffect } from 'react'
import { Sparkles, Wand2, Code, Globe, Rocket, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Textarea } from './ui/textarea'
import { Card } from './ui/Card'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export function LLMProjectBuilder() {
  const [customIdea, setCustomIdea] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProject, setGeneratedProject] = useState<any>(null)
  const [domains, setDomains] = useState<any[]>([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const { user } = useAuth()

  const loadDomains = useCallback(async () => {
    if (!user) return
    try {
      const userDomains = await blink.db.domains.list({ where: { userId: user.id } })
      setDomains(userDomains)
    } catch (error) {
      console.error('Failed to load domains:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) loadDomains()
  }, [user, loadDomains])

  const generateFromCustomIdea = async () => {
    if (!customIdea.trim()) {
      toast.error('Please describe your project idea')
      return
    }

    setIsGenerating(true)
    try {
      const { text } = await blink.ai.generateText({ prompt: `Analyze this project idea and create a structured plan: "${customIdea}"` })
      const ideaStructure = JSON.parse(text)
      // simplified generation flow - create a project record
      const project = await blink.db.projects.create({
        id: `proj_${Date.now()}`,
        title: ideaStructure.title || 'New Project',
        description: ideaStructure.description || '',
        category: ideaStructure.category || 'misc',
        status: 'published',
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        healthScore: 100,
        lastHealthCheck: new Date().toISOString(),
        dependencies: JSON.stringify(ideaStructure.techStack || []),
        roadmapItems: JSON.stringify([]),
        generatedAssets: JSON.stringify(ideaStructure.features || [])
      })
      setGeneratedProject(project)
      toast.success('Project generated successfully!')
    } catch (error) {
      console.error('Failed to analyze custom idea:', error)
      toast.error('Failed to analyze your idea. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const deployToSelectedDomain = async () => {
    if (!selectedDomain || !generatedProject) {
      toast.error('Please select a domain')
      return
    }

    try {
      await blink.db.domains.update(selectedDomain, { projectId: generatedProject.id })
      toast.success('Project deployed to domain successfully!')
    } catch (error) {
      console.error('Failed to deploy to domain:', error)
      toast.error('Failed to deploy to domain')
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI Project Builder</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Describe your project idea and watch as AI generates a project.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="custom-idea">Project Description</Label>
            <Textarea id="custom-idea" value={customIdea} onChange={(e) => setCustomIdea(e.target.value)} rows={6} />
            <Button onClick={generateFromCustomIdea} className="w-full" disabled={!customIdea.trim()}>Generate from Idea</Button>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Or choose a template (omitted)</h3>
          </div>
        </Card>
      </div>
      {generatedProject && (
        <Card className="p-6">
          <h3 className="font-semibold">{generatedProject.title}</h3>
          <p className="text-muted-foreground">{generatedProject.description}</p>
          <div className="mt-4">
            <Label htmlFor="domain-select">Deploy to Domain</Label>
            <select id="domain-select" value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="">Select a domain...</option>
              {domains.map(d => (<option key={d.id} value={d.id}>{d.domain}</option>))}
            </select>
            <Button onClick={deployToSelectedDomain} className="mt-4 w-full">Deploy</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default LLMProjectBuilder