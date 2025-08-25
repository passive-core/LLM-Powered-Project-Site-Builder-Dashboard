import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Slider } from './ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Play, Pause, Square, RotateCcw, Download, Upload, Layers, Volume2, VolumeX, Scissors, Copy, Trash2 } from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface TimelineItem {
  id: string
  type: 'video' | 'audio' | 'image' | 'text' | 'effect'
  name: string
  url?: string
  startTime: number
  duration: number
  layer: number
  properties: Record<string, any>
}

interface MediaProject {
  id: string
  title: string
  type: 'cartoon' | 'video' | 'animation' | 'social_post' | 'website'
  content: {
    timeline: TimelineItem[]
    layers: number
    duration: number
    resolution: { width: number; height: number }
  }
  assets: string[]
  status: 'draft' | 'rendering' | 'completed' | 'published'
  outputUrl?: string
  thumbnailUrl?: string
}

interface MediaEditorProps {
  projectId: string
  onClose: () => void
}

export default function MediaEditor({ projectId, onClose }: MediaEditorProps) {
  const { user } = useAuth()
  const [project, setProject] = useState<MediaProject | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [renderProgress, setRenderProgress] = useState(0)
  const [isRendering, setIsRendering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectId && user) {
      loadProject()
    }
  }, [projectId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProject = async () => {
    try {
      const projects = await blink.db.mediaProjects.list({
        where: { id: projectId, userId: user?.id }
      })
      
      if (projects.length > 0) {
        const projectData = projects[0]
        setProject({
          ...projectData,
          content: JSON.parse(projectData.content || '{}'),
          assets: JSON.parse(projectData.assets || '[]')
        })
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      toast.error('Failed to load project')
    }
  }

  const saveProject = async () => {
    if (!project || !user) return

    try {
      await blink.db.mediaProjects.update(project.id, {
        content: JSON.stringify(project.content),
        assets: JSON.stringify(project.assets),
        updatedAt: new Date().toISOString()
      })
      toast.success('Project saved')
    } catch (error) {
      console.error('Failed to save project:', error)
      toast.error('Failed to save project')
    }
  }

  const addTimelineItem = (type: TimelineItem['type'], url?: string) => {
    if (!project) return

    const newItem: TimelineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type} ${project.content.timeline.length + 1}`,
      url,
      startTime: currentTime,
      duration: type === 'image' ? 3 : 5, // Default durations
      layer: 0,
      properties: {
        volume: type === 'audio' ? 1 : 0,
        opacity: 1,
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0
      }
    }

    setProject(prev => prev ? {
      ...prev,
      content: {
        ...prev.content,
        timeline: [...prev.content.timeline, newItem],
        duration: Math.max(prev.content.duration, newItem.startTime + newItem.duration)
      }
    } : null)
  }

  const updateTimelineItem = (itemId: string, updates: Partial<TimelineItem>) => {
    if (!project) return

    setProject(prev => prev ? {
      ...prev,
      content: {
        ...prev.content,
        timeline: prev.content.timeline.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      }
    } : null)
  }

  const deleteTimelineItem = (itemId: string) => {
    if (!project) return

    setProject(prev => prev ? {
      ...prev,
      content: {
        ...prev.content,
        timeline: prev.content.timeline.filter(item => item.id !== itemId)
      }
    } : null)
    
    if (selectedItem === itemId) {
      setSelectedItem(null)
    }
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    // Implement actual playback logic here
  }

  const renderVideo = async () => {
    if (!project || !user) return

    try {
      setIsRendering(true)
      setRenderProgress(0)

      // Simulate rendering progress
      const progressInterval = setInterval(() => {
        setRenderProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 10
        })
      }, 500)

      // In a real implementation, this would call a video rendering service
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 5000))

      clearInterval(progressInterval)
      setRenderProgress(100)

      // Update project status
      await blink.db.mediaProjects.update(project.id, {
        status: 'completed',
        outputUrl: 'https://example.com/rendered-video.mp4', // Placeholder
        updatedAt: new Date().toISOString()
      })

      toast.success('Video rendered successfully!')
      loadProject()
    } catch (error) {
      console.error('Rendering failed:', error)
      toast.error('Failed to render video')
    } finally {
      setIsRendering(false)
      setRenderProgress(0)
    }
  }

  const exportProject = async (format: 'mp4' | 'gif' | 'webm') => {
    if (!project) return

    try {
      // In a real implementation, this would handle different export formats
      toast.info(`Exporting as ${format.toUpperCase()}...`)
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export project')
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">{project.title}</h1>
            <p className="text-sm text-muted-foreground">{project.type} project</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveProject}>
            Save
          </Button>
          <Button onClick={renderVideo} disabled={isRendering}>
            {isRendering ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                Rendering...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Render
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Rendering Progress */}
      {isRendering && (
        <div className="p-4 bg-muted">
          <div className="flex items-center gap-4">
            <Progress value={renderProgress} className="flex-1" />
            <span className="text-sm">{Math.round(renderProgress)}%</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Preview Canvas */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '60vh', maxWidth: '100%' }}>
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-full"
              />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Preview Canvas</p>
                  <p className="text-sm opacity-75">{project.content.resolution.width}x{project.content.resolution.height}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="border-t p-4">
            <div className="flex items-center gap-4">
              <Button size="sm" onClick={togglePlayback}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" onClick={() => setCurrentTime(0)}>
                <Square className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => setCurrentTime(value)}
                  max={project.content.duration}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-muted-foreground min-w-[80px]">
                {currentTime.toFixed(1)}s / {project.content.duration.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t bg-muted/30" style={{ height: '200px' }}>
            <div className="p-2 border-b bg-background">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => addTimelineItem('video')}>
                  <Upload className="w-4 h-4 mr-1" />
                  Add Video
                </Button>
                <Button size="sm" onClick={() => addTimelineItem('image')}>
                  <Upload className="w-4 h-4 mr-1" />
                  Add Image
                </Button>
                <Button size="sm" onClick={() => addTimelineItem('text')}>
                  <Upload className="w-4 h-4 mr-1" />
                  Add Text
                </Button>
                <Button size="sm" onClick={() => addTimelineItem('effect')}>
                  <Upload className="w-4 h-4 mr-1" />
                  Add Effect
                </Button>
              </div>
            </div>
            <div ref={timelineRef} className="flex-1 overflow-auto p-2">
              <div className="relative" style={{ height: '150px', width: `${project.content.duration * 100}px`, minWidth: '100%' }}>
                {/* Timeline ruler */}
                <div className="absolute top-0 left-0 right-0 h-6 border-b bg-background">
                  {Array.from({ length: Math.ceil(project.content.duration) }, (_, i) => (
                    <div key={i} className="absolute border-l border-muted-foreground/20" style={{ left: `${(i / project.content.duration) * 100}%` }}>
                      <span className="text-xs text-muted-foreground ml-1">{i}s</span>
                    </div>
                  ))}
                </div>
                
                {/* Timeline items */}
                {project.content.timeline.map((item, index) => (
                  <div
                    key={item.id}
                    className={`absolute h-8 bg-primary/80 rounded border-2 cursor-pointer hover:bg-primary transition-colors ${
                      selectedItem === item.id ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{
                      left: `${(item.startTime / project.content.duration) * 100}%`,
                      width: `${(item.duration / project.content.duration) * 100}%`,
                      top: `${30 + (item.layer * 35)}px`
                    }}
                    onClick={() => setSelectedItem(item.id)}
                  >
                    <div className="px-2 py-1 text-xs text-white truncate">
                      {item.name}
                    </div>
                  </div>
                ))}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${(currentTime / project.content.duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l bg-muted/30">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="p-4 space-y-4">
              {selectedItem ? (
                <PropertiesPanel
                  item={project.content.timeline.find(item => item.id === selectedItem)!}
                  onUpdate={(updates) => updateTimelineItem(selectedItem, updates)}
                  onDelete={() => deleteTimelineItem(selectedItem)}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Layers className="w-8 h-8 mx-auto mb-2" />
                  <p>Select a timeline item to edit properties</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="effects" className="p-4">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Fade In/Out
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Zoom
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Blur
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Color Filter
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Options</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => exportProject('mp4')}>
                    Export as MP4
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => exportProject('gif')}>
                    Export as GIF
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => exportProject('webm')}>
                    Export as WebM
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Share</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Upload to YouTube
                  </Button>
                  <Button variant="outline" className="w-full">
                    Share on Social
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function PropertiesPanel({ item, onUpdate, onDelete }: {
  item: TimelineItem
  onUpdate: (updates: Partial<TimelineItem>) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">{item.name}</h3>
        <Badge variant="secondary">{item.type}</Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Start Time</label>
          <Input
            type="number"
            value={item.startTime}
            onChange={(e) => onUpdate({ startTime: parseFloat(e.target.value) })}
            step={0.1}
            min={0}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Duration</label>
          <Input
            type="number"
            value={item.duration}
            onChange={(e) => onUpdate({ duration: parseFloat(e.target.value) })}
            step={0.1}
            min={0.1}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Layer</label>
          <Input
            type="number"
            value={item.layer}
            onChange={(e) => onUpdate({ layer: parseInt(e.target.value) })}
            min={0}
          />
        </div>
        
        {item.type !== 'text' && (
          <div>
            <label className="text-sm font-medium">Opacity</label>
            <Slider
              value={[item.properties.opacity * 100]}
              onValueChange={([value]) => onUpdate({ 
                properties: { ...item.properties, opacity: value / 100 }
              })}
              max={100}
              step={1}
            />
          </div>
        )}
        
        {(item.type === 'audio' || item.type === 'video') && (
          <div>
            <label className="text-sm font-medium">Volume</label>
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4" />
              <Slider
                value={[item.properties.volume * 100]}
                onValueChange={([value]) => onUpdate({ 
                  properties: { ...item.properties, volume: value / 100 }
                })}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 pt-4 border-t">
        <Button size="sm" variant="outline">
          <Copy className="w-4 h-4 mr-1" />
          Duplicate
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}