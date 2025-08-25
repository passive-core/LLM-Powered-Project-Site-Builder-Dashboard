import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Project } from '../types/project'
import { MoreVertical, Calendar, Activity, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onView?: (project: Project) => void
}

function getStatusVariant(status: Project['status']) {
  switch (status) {
    case 'idea':
      return 'outline'
    case 'in_progress':
      return 'warning'
    case 'published':
      return 'success'
    default:
      return 'default'
  }
}

function getHealthColor(score: number) {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  return 'text-red-500'
}

function ProjectCardInner({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  const statusVariant = getStatusVariant(project.status)
  const healthColor = getHealthColor(project.healthScore)

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg font-semibold truncate">{project.title}</CardTitle>
              <Badge variant={statusVariant} className="capitalize">{project.status.replace('_', ' ')}</Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {project.description || 'No description provided'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {project.category && (<div className="flex items-center text-sm text-muted-foreground"><span className="bg-muted px-2 py-1 rounded-md text-xs">{project.category}</span></div>)}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-muted-foreground">Health Score</span>
            </div>
            <span className={cn('font-medium', healthColor)}>{project.healthScore}%</span>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Updated</span>
            </div>
            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>

          {project.roadmapItems && project.roadmapItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-xs">{project.roadmapItems.filter(item => item.status === 'completed').length} / {project.roadmapItems.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(project.roadmapItems.filter(item => item.status === 'completed').length / project.roadmapItems.length) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onView?.(project)}><Zap className="w-4 h-4 mr-2" />View</Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(project)}>Edit</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const MemoizedProjectCard = React.memo(ProjectCardInner)
export default MemoizedProjectCard
