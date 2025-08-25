import React, { useState, useEffect, useCallback } from 'react'
import { Globe, Plus, ExternalLink, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface Domain {
  id: string
  domain: string
  projectId?: string
  userId: string
  createdAt: string
  status?: 'active' | 'pending' | 'error'
  sslStatus?: 'active' | 'pending' | 'error'
}

interface Project {
  id: string
  title: string
  status: string
}

export function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()

  const addDefaultDomain = useCallback(async () => {
    if (!user) return
    try {
      const existingDomains = await blink.db.domains.list({
        where: { userId: user.id, domain: 'http://passive-core.com' }
      })
      if (existingDomains.length === 0) {
        await blink.db.domains.create({
          id: `dom_passive_core_${Date.now()}`,
          domain: 'http://passive-core.com',
          userId: user.id,
          createdAt: new Date().toISOString()
        })
        // Reload domains after creating default
        loadDomains()
      }
    } catch (error) {
      console.error('Failed to add default domain:', error)
    }
  }, [user])

  const loadDomains = useCallback(async () => {
    if (!user) return
    try {
      const userDomains = await blink.db.domains.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setDomains(userDomains)
    } catch (error) {
      console.error('Failed to load domains:', error)
      toast.error('Failed to load domains')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadProjects = useCallback(async () => {
    if (!user) return
    try {
      const userProjects = await blink.db.projects.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      })
      setProjects(userProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadDomains()
      loadProjects()
      addDefaultDomain()
    }
  }, [user, loadDomains, loadProjects, addDefaultDomain])

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain name')
      return
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(newDomain)) {
      toast.error('Please enter a valid domain name')
      return
    }

    setIsAddingDomain(true)
    try {
      const domain = await blink.db.domains.create({
        id: `dom_${Date.now()}`,
        domain: newDomain.toLowerCase(),
        projectId: selectedProject || null,
        userId: user.id,
        createdAt: new Date().toISOString()
      })

      setDomains(prev => [domain, ...prev])
      setNewDomain('')
      setSelectedProject('')
      setIsModalOpen(false)
      toast.success(`Domain ${newDomain} added successfully!`)
    } catch (error) {
      console.error('Failed to add domain:', error)
      toast.error('Failed to add domain')
    } finally {
      setIsAddingDomain(false)
    }
  }

  const removeDomain = async (domainId: string, domainName: string) => {
    try {
      await blink.db.domains.delete(domainId)
      setDomains(prev => prev.filter(d => d.id !== domainId))
      toast.success(`Domain ${domainName} removed successfully`)
    } catch (error) {
      console.error('Failed to remove domain:', error)
      toast.error('Failed to remove domain')
    }
  }

  const connectToProject = async (domainId: string, projectId: string) => {
    try {
      await blink.db.domains.update(domainId, { projectId })
      setDomains(prev => prev.map(d => d.id === domainId ? { ...d, projectId } : d))
      toast.success('Domain connected to project successfully')
    } catch (error) {
      console.error('Failed to connect domain:', error)
      toast.error('Failed to connect domain to project')
    }
  }

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.title || 'Unknown Project'
  }

  const getDomainStatus = (domain: Domain) => {
    if (domain.domain === 'passive-core.com') {
      return 'active'
    }
    return domain.status || 'pending'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading domains...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domain Management</h2>
          <p className="text-muted-foreground">Manage your custom domains and connect them to projects</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your domain without http:// or https://
                </p>
              </div>
              <div>
                <Label htmlFor="project">Connect to Project (Optional)</Label>
                <select
                  id="project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addDomain} disabled={isAddingDomain}>
                  {isAddingDomain ? 'Adding...' : 'Add Domain'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {domains.length === 0 ? (
        <Card className="p-8 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No domains added yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your custom domains to connect them with your projects
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Domain
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => {
            const status = getDomainStatus(domain)
            return (
              <Card key={domain.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{domain.domain}</span>
                          <Badge 
                            variant={status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {status}
                          </Badge>
                        </div>
                        {domain.projectId && (
                          <p className="text-sm text-muted-foreground">
                            Connected to: {getProjectTitle(domain.projectId)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status === 'active' && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit
                        </a>
                      </Button>
                    )}
                    {!domain.projectId && projects.length > 0 && (
                      <select
                        onChange={(e) => connectToProject(domain.id, e.target.value)}
                        className="text-sm p-1 border rounded"
                        defaultValue=""
                      >
                        <option value="">Connect to project...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeDomain(domain.id, domain.domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {domain.domain === 'passive-core.com' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      🎉 This is your test domain! Ready to build your first AI-generated project.
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {domains.some(d => d.domain === 'passive-core.com') && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Ready for AI Project Generation!</h3>
              <p className="text-blue-800 mt-1">
                Your passive-core.com domain is ready. Use the AI assistant to generate your first project and deploy it to this domain.
              </p>
              <Button className="mt-3" size="sm">
                Start Building with AI
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DomainManager