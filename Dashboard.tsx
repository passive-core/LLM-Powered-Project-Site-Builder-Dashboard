import React, { useState, useEffect, useCallback, useDeferredValue, startTransition } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Search, Plus, Filter, LayoutGrid, List as ListIcon, MessageSquare, Activity } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import ProjectCard from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import { ChatAssistant } from './ChatAssistant'
import { Dialog, DialogContent } from './ui/dialog'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { getEnabledServices } from '../services'
import type { Project } from '../types/project'
import { useBuildOptimization } from '../hooks/useBuildOptimization'

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'idea' | 'in_progress' | 'published'

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showChat, setShowChat] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const enabledServices = getEnabledServices()
  const [buildState, buildActions] = useBuildOptimization()

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
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Prefetch likely next components for faster navigation
  useEffect(() => {
    if (!isAuthenticated) return
    // Preload chat and design studio when on dashboard
    buildActions.preloadComponents([
      './components/ChatAssistant',
      './components/DesignStudio',
      './components/ProjectSummarizer'
    ])
  }, [isAuthenticated, buildActions])

  // Filtering with concurrent UI APIs to keep UI responsive
  useEffect(() => {
    startTransition(() => {
      let filtered = projects

      if (statusFilter !== 'all') {
        filtered = filtered.filter(project => project.status === statusFilter)
      }

      if (deferredQuery.trim()) {
        const q = deferredQuery.toLowerCase()
        filtered = filtered.filter(project => (
          project.title.toLowerCase().includes(q) ||
          project.description?.toLowerCase().includes(q) ||
          project.category?.toLowerCase().includes(q)
        ))
      }

      setFilteredProjects(filtered)
    })
  }, [projects, statusFilter, deferredQuery])

  useEffect(() => {
    if (isAuthenticated && user) loadProjects()
    else if (!isAuthenticated) setIsLoading(false)
  }, [isAuthenticated, user, loadProjects])

  const handleProjectCreated = useCallback((newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
    setIsModalOpen(false)
  }, [])

  const handleProjectClick = useCallback((project: Project) => {
    setSelectedProject(project)
  }, [])

  const getStatusCount = useCallback((status: FilterStatus) => {
    if (status === 'all') return projects.length
    return projects.filter(p => p.status === status).length
  }, [projects])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Welcome to Project Builder</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to start creating and managing your AI-powered projects.
          </p>
          <Button onClick={() => blink.auth.login()} className="w-full">
            Sign In
          </Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowChat(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'idea', 'in_progress', 'published'] as FilterStatus[]).map(status => (
          <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)} className="flex items-center space-x-2">
            <span className="capitalize">{status === 'all' ? 'All Projects' : status.replace('_', ' ')}</span>
            <Badge variant="secondary" className="ml-2">{getStatusCount(status)}</Badge>
          </Button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}</h3>
          <p className="text-muted-foreground mb-4">{projects.length === 0 ? 'Create your first AI-powered project to get started' : 'Try adjusting your search or filters'}</p>
          {projects.length === 0 && (<Button onClick={() => setIsModalOpen(true)}>Create Your First Project</Button>)}
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} onClick={() => handleProjectClick(project)} className="cursor-pointer">
                <ProjectCard project={project} onView={() => handleProjectClick(project)} />
              </div>
            ))}
          </div>
        ) : (
          // Virtualized List
          <div style={{ height: 600 }}>
            <List
              height={600}
              itemCount={filteredProjects.length}
              itemSize={140}
              width={'100%'}
            >
              {({ index, style }) => {
                const project = filteredProjects[index]
                return (
                  <div style={style} key={project.id} className="p-2">
                    <div onClick={() => handleProjectClick(project)}>
                      <ProjectCard project={project} onView={() => handleProjectClick(project)} />
                    </div>
                  </div>
                )
              }}
            </List>
          </div>
        )
      )}

      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={handleProjectCreated} />

      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-2xl h-[600px] p-0">
          <ChatAssistant onClose={() => setShowChat(false)} />
        </DialogContent>
      </Dialog>

      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="max-w-5xl h-[85vh] p-0">
            {/* Kept original project details UI inside modal for brevity */}
            <div className="p-6">
              <h3 className="text-xl font-bold">{selectedProject.title}</h3>
              <p className="text-muted-foreground">{selectedProject.description}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default Dashboard
