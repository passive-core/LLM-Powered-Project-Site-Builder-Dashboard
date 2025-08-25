import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Progress } from './ui/progress'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface HealthCheckProps {
  projectId: string
  onHealthUpdate?: (score: number) => void
}

interface HealthIssue {
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  suggestion?: string
}

interface HealthReport {
  score: number
  issues: HealthIssue[]
  lastCheck: Date
  dependencies: string[]
  suggestions: string[]
}

export function HealthCheck({ projectId, onHealthUpdate }: HealthCheckProps) {
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [project, setProject] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadProject()
    loadHealthReport()
  }, [projectId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProject = async () => {
    if (!user) return
    try {
      const projectData = await blink.db.projects.list({
        where: { id: projectId, userId: user.id },
        limit: 1
      })
      if (projectData.length > 0) {
        setProject(projectData[0])
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const loadHealthReport = async () => {
    if (!project) return
    
    const lastCheck = project.lastHealthCheck ? new Date(project.lastHealthCheck) : new Date()
    const dependencies = JSON.parse(project.dependencies || '[]')
    
    setHealthReport({
      score: project.healthScore || 100,
      issues: [],
      lastCheck,
      dependencies,
      suggestions: []
    })
  }

  const runHealthCheck = async () => {
    if (!user || !project) return
    
    setIsChecking(true)
    
    try {
      // Generate health check analysis using AI
      const healthPrompt = `
Analyze the health of this project and provide a comprehensive health report:

Project: ${project.title}
Description: ${project.description}
Status: ${project.status}
Created: ${new Date(project.createdAt).toLocaleDateString()}
Last Updated: ${new Date(project.updatedAt).toLocaleDateString()}
Roadmap Items: ${project.roadmapItems || '[]'}
Dependencies: ${project.dependencies || '[]'}

Provide a JSON response with:
{
  "score": number (0-100),
  "issues": [
    {
      "type": "warning|error|info",
      "title": "Issue title",
      "description": "Detailed description",
      "suggestion": "How to fix this"
    }
  ],
  "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"]
}

Consider factors like:
- Project activity and updates
- Roadmap progress
- Dependencies and potential conflicts
- Project scope and complexity
- Status consistency
- Time since last update
      `
      
      const { object } = await blink.ai.generateObject({
        prompt: healthPrompt,
        schema: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['warning', 'error', 'info'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  suggestion: { type: 'string' }
                },
                required: ['type', 'title', 'description']
              }
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['score', 'issues', 'suggestions']
        }
      })
      
      const newHealthReport: HealthReport = {
        score: object.score,
        issues: object.issues,
        lastCheck: new Date(),
        dependencies: JSON.parse(project.dependencies || '[]'),
        suggestions: object.suggestions
      }
      
      setHealthReport(newHealthReport)
      
      // Update project with new health data
      await blink.db.projects.update(projectId, {
        healthScore: object.score,
        lastHealthCheck: new Date().toISOString()
      })
      
      onHealthUpdate?.(object.score)
      
    } catch (error) {
      console.error('Health check failed:', error)
      
      // Fallback health report
      const fallbackReport: HealthReport = {
        score: 75,
        issues: [{
          type: 'warning',
          title: 'Health Check Error',
          description: 'Unable to perform comprehensive health check',
          suggestion: 'Try running the health check again later'
        }],
        lastCheck: new Date(),
        dependencies: JSON.parse(project.dependencies || '[]'),
        suggestions: ['Consider updating project documentation', 'Review project roadmap']
      }
      
      setHealthReport(fallbackReport)
    } finally {
      setIsChecking(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  if (!healthReport) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Project Health</h3>
          </div>
          <Button onClick={runHealthCheck} disabled={isChecking}>
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              'Run Health Check'
            )}
          </Button>
        </div>
        <p className="text-muted-foreground">Run a health check to analyze your project status.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Project Health</h3>
        </div>
        <Button onClick={runHealthCheck} disabled={isChecking} variant="outline" size="sm">
          {isChecking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isChecking ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {/* Health Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Health Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(healthReport.score)}`}>
            {healthReport.score}/100
          </span>
        </div>
        <Progress value={healthReport.score} className="h-2" />
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last checked: {healthReport.lastCheck.toLocaleString()}
        </div>
      </div>

      {/* Issues */}
      {healthReport.issues.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Issues Found</h4>
          <div className="space-y-3">
            {healthReport.issues.map((issue, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg border">
                {getIssueIcon(issue.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{issue.title}</span>
                    <Badge variant={issue.type === 'error' ? 'destructive' : issue.type === 'warning' ? 'secondary' : 'default'}>
                      {issue.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                  {issue.suggestion && (
                    <p className="text-xs text-primary bg-primary/10 p-2 rounded">
                      💡 {issue.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {healthReport.dependencies.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Dependencies</h4>
          <div className="flex flex-wrap gap-2">
            {healthReport.dependencies.map((dep, index) => (
              <Badge key={index} variant="outline">{dep}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {healthReport.suggestions.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Improvement Suggestions</h4>
          <ul className="space-y-2">
            {healthReport.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}