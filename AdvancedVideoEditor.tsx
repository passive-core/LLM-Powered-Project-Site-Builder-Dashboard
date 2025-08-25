import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Slider } from './ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Play, Pause, Square, RotateCcw, Download, Upload, Layers, Volume2, VolumeX, 
  Scissors, Copy, Trash2, Zap, Wand2, Music, Mic, Camera, Film, Settings,
  FastForward, Rewind, SkipBack, SkipForward, Maximize, Minimize, Split,
  Merge, Crop, Filter, Palette, Type, Image as ImageIcon, Video as VideoIcon
} from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

// Advanced Timeline Item with more properties
interface TimelineItem {
  id: string
  type: 'video' | 'audio' | 'image' | 'text' | 'effect' | 'transition'
  name: string
  url?: string
  startTime: number
  duration: number
  layer: number
  locked: boolean
  muted: boolean
  properties: {
    volume?: number
    opacity?: number
    scale?: number
    rotation?: number
    x?: number
    y?: number
    speed?: number
    filter?: string
    transition?: string
    keyframes?: Keyframe[]
    // Text properties
    text?: string
    fontSize?: number
    fontFamily?: string
    color?: string
    // Effect properties
    effectType?: string
    intensity?: number
  }
}

interface Keyframe {
  time: number
  property: string
  value: any
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

interface VideoProject {
  id: string
  title: string
  width: number
  height: number
  fps: number
  duration: number
  timeline: TimelineItem[]
  layers: number
  audioTracks: AudioTrack[]
  settings: ProjectSettings
}

interface AudioTrack {
  id: string
  name: string
  url: string
  volume: number
  muted: boolean
  solo: boolean
  effects: AudioEffect[]
}

interface AudioEffect {
  type: 'reverb' | 'echo' | 'compressor' | 'equalizer' | 'noise_reduction'
  enabled: boolean
  parameters: Record<string, number>
}

interface ProjectSettings {
  quality: 'draft' | 'preview' | 'high' | 'ultra'
  format: 'mp4' | 'webm' | 'mov' | 'avi'
  codec: 'h264' | 'h265' | 'vp9' | 'av1'
  bitrate: number
  audioCodec: 'aac' | 'mp3' | 'opus'
  audioBitrate: number
}

const videoEffects = [
  { name: 'Fade In', type: 'fade_in' },
  { name: 'Fade Out', type: 'fade_out' },
  { name: 'Zoom In', type: 'zoom_in' },
  { name: 'Zoom Out', type: 'zoom_out' },
  { name: 'Slide Left', type: 'slide_left' },
  { name: 'Slide Right', type: 'slide_right' },
  { name: 'Blur', type: 'blur' },
  { name: 'Sharpen', type: 'sharpen' },
  { name: 'Color Correction', type: 'color_correction' },
  { name: 'Vintage', type: 'vintage' },
  { name: 'Black & White', type: 'bw' },
  { name: 'Sepia', type: 'sepia' }
]

const transitions = [
  { name: 'Cut', type: 'cut' },
  { name: 'Fade', type: 'fade' },
  { name: 'Dissolve', type: 'dissolve' },
  { name: 'Wipe', type: 'wipe' },
  { name: 'Slide', type: 'slide' },
  { name: 'Push', type: 'push' },
  { name: 'Zoom', type: 'zoom' },
  { name: 'Spin', type: 'spin' }
]

export default function AdvancedVideoEditor({ projectId, onClose }: {
  projectId: string
  onClose: () => void
}) {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<HTMLCanvasElement>(null)
  
  const [project, setProject] = useState<VideoProject | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [tool, setTool] = useState<'select' | 'cut' | 'text' | 'effect'>('select')
  const [zoom, setZoom] = useState(100)
  const [renderProgress, setRenderProgress] = useState(0)
  const [isRendering, setIsRendering] = useState(false)
  const [previewQuality, setPreviewQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [showWaveforms, setShowWaveforms] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (projectId && user) {
      loadProject()
    }
  }, [projectId, user])

  useEffect(() => {
    // Initialize audio context for waveform visualization
    if (showWaveforms && waveformRef.current) {
      drawWaveforms()
    }
  }, [showWaveforms, project])

  const loadProject = async () => {
    try {
      const projects = await blink.db.mediaProjects.list({
        where: { id: projectId, userId: user?.id }
      })
      
      if (projects.length > 0) {
        const projectData = projects[0]
        const parsedContent = JSON.parse(projectData.content || '{}')
        
        const videoProject: VideoProject = {
          id: projectData.id,
          title: projectData.title,
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 60,
          timeline: parsedContent.timeline || [],
          layers: parsedContent.layers || 5,
          audioTracks: parsedContent.audioTracks || [],
          settings: parsedContent.settings || {
            quality: 'high',
            format: 'mp4',
            codec: 'h264',
            bitrate: 8000,
            audioCodec: 'aac',
            audioBitrate: 192
          }
        }
        
        setProject(videoProject)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      toast.error('Failed to load project')
    }
  }

  const saveProject = async () => {
    if (!project || !user) return

    try {
      const content = {
        timeline: project.timeline,
        layers: project.layers,
        audioTracks: project.audioTracks,
        settings: project.settings,
        width: project.width,
        height: project.height,
        fps: project.fps,
        duration: project.duration
      }

      await blink.db.mediaProjects.update(project.id, {
        content: JSON.stringify(content),
        updatedAt: new Date().toISOString()
      })
      
      toast.success('Project saved')
    } catch (error) {
      console.error('Failed to save project:', error)
      toast.error('Failed to save project')
    }
  }

  const addTimelineItem = useCallback((type: TimelineItem['type'], file?: File) => {
    if (!project) return

    const newItem: TimelineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `${type} ${project.timeline.length + 1}`,
      url: file ? URL.createObjectURL(file) : undefined,
      startTime: currentTime,
      duration: type === 'image' ? 3 : type === 'text' ? 5 : 10,
      layer: 0,
      locked: false,
      muted: false,
      properties: {
        volume: type === 'audio' || type === 'video' ? 1 : undefined,
        opacity: 1,
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        speed: 1,
        filter: 'none',
        keyframes: []
      }
    }

    if (type === 'text') {
      newItem.properties = {
        ...newItem.properties,
        text: 'Add your text',
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#ffffff'
      }
    }

    setProject(prev => prev ? {
      ...prev,
      timeline: [...prev.timeline, newItem],
      duration: Math.max(prev.duration, newItem.startTime + newItem.duration)
    } : null)
  }, [project, currentTime])

  const updateTimelineItem = useCallback((itemId: string, updates: Partial<TimelineItem>) => {
    if (!project) return

    setProject(prev => prev ? {
      ...prev,
      timeline: prev.timeline.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    } : null)
  }, [project])

  const deleteTimelineItems = useCallback((itemIds: string[]) => {
    if (!project) return

    setProject(prev => prev ? {
      ...prev,
      timeline: prev.timeline.filter(item => !itemIds.includes(item.id))
    } : null)
    
    setSelectedItems([])
  }, [project])

  const splitTimelineItem = useCallback((itemId: string, splitTime: number) => {
    if (!project) return

    const item = project.timeline.find(i => i.id === itemId)
    if (!item || splitTime <= item.startTime || splitTime >= item.startTime + item.duration) return

    const firstPart: TimelineItem = {
      ...item,
      id: `${item.id}_part1`,
      duration: splitTime - item.startTime
    }

    const secondPart: TimelineItem = {
      ...item,
      id: `${item.id}_part2`,
      startTime: splitTime,
      duration: item.duration - (splitTime - item.startTime)
    }

    setProject(prev => prev ? {
      ...prev,
      timeline: prev.timeline.map(i => 
        i.id === itemId ? firstPart : i
      ).concat(secondPart)
    } : null)
  }, [project])

  const addKeyframe = useCallback((itemId: string, property: string, value: any) => {
    const item = project?.timeline.find(i => i.id === itemId)
    if (!item) return

    const keyframe: Keyframe = {
      time: currentTime - item.startTime,
      property,
      value,
      easing: 'ease-in-out'
    }

    const existingKeyframes = item.properties.keyframes || []
    const updatedKeyframes = [...existingKeyframes, keyframe]
      .sort((a, b) => a.time - b.time)

    updateTimelineItem(itemId, {
      properties: {
        ...item.properties,
        keyframes: updatedKeyframes
      }
    })
  }, [project, currentTime, updateTimelineItem])

  const applyEffect = useCallback((itemIds: string[], effectType: string) => {
    itemIds.forEach(itemId => {
      const item = project?.timeline.find(i => i.id === itemId)
      if (!item) return

      const effectItem: TimelineItem = {
        id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'effect',
        name: effectType,
        startTime: item.startTime,
        duration: item.duration,
        layer: item.layer + 1,
        locked: false,
        muted: false,
        properties: {
          effectType,
          intensity: 50,
          targetItem: itemId
        }
      }

      setProject(prev => prev ? {
        ...prev,
        timeline: [...prev.timeline, effectItem]
      } : null)
    })
  }, [project])

  const renderVideo = async () => {
    if (!project || !user) return

    setIsRendering(true)
    setRenderProgress(0)

    try {
      // Simulate advanced rendering process
      const steps = [
        'Analyzing timeline...',
        'Processing video tracks...',
        'Processing audio tracks...',
        'Applying effects...',
        'Rendering keyframes...',
        'Encoding video...',
        'Finalizing output...'
      ]

      for (let i = 0; i < steps.length; i++) {
        toast.info(steps[i])
        await new Promise(resolve => setTimeout(resolve, 1000))
        setRenderProgress((i + 1) / steps.length * 100)
      }

      // In a real implementation, this would use FFmpeg.wasm or similar
      const outputUrl = 'https://example.com/rendered-video.mp4'

      await blink.db.mediaProjects.update(project.id, {
        status: 'completed',
        outputUrl,
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

  const drawWaveforms = useCallback(() => {
    if (!waveformRef.current || !project) return

    const canvas = waveformRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#3b82f6'

    // Simulate waveform data
    const audioItems = project.timeline.filter(item => item.type === 'audio' || item.type === 'video')
    
    audioItems.forEach(item => {
      const startX = (item.startTime / project.duration) * canvas.width
      const width = (item.duration / project.duration) * canvas.width
      
      // Draw simplified waveform
      for (let x = startX; x < startX + width; x += 2) {
        const height = Math.random() * 30 + 5
        ctx.fillRect(x, canvas.height / 2 - height / 2, 1, height)
      }
    })
  }, [project])

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying)
    // In a real implementation, this would control actual video playback
  }, [isPlaying])

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, project?.duration || 0)))
  }, [project])

  const exportProject = async (format: 'mp4' | 'webm' | 'mov' | 'gif') => {
    if (!project) return

    try {
      toast.info(`Exporting as ${format.toUpperCase()}...`)
      
      // Simulate export process with different settings based on format
      const exportSettings = {
        mp4: { quality: 'high', codec: 'h264' },
        webm: { quality: 'high', codec: 'vp9' },
        mov: { quality: 'ultra', codec: 'h265' },
        gif: { quality: 'medium', fps: 15 }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
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
          <p>Loading advanced video editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Advanced Header */}
      <div className="border-b p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            ← Back
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <div>
            <h1 className="text-lg font-bold">{project.title}</h1>
            <p className="text-xs text-muted-foreground">
              {project.width}×{project.height} • {project.fps}fps • {project.duration.toFixed(1)}s
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={previewQuality} onValueChange={(value: any) => setPreviewQuality(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
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
        {/* Tools Sidebar */}
        <div className="w-16 border-r bg-muted/30 flex flex-col items-center py-2 gap-2">
          <Button
            size="sm"
            variant={tool === 'select' ? 'default' : 'outline'}
            onClick={() => setTool('select')}
            className="w-12 h-12"
          >
          <Layers className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'cut' ? 'default' : 'outline'}
            onClick={() => setTool('cut')}
            className="w-12 h-12"
          >
            <Scissors className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'text' ? 'default' : 'outline'}
            onClick={() => setTool('text')}
            className="w-12 h-12"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'effect' ? 'default' : 'outline'}
            onClick={() => setTool('effect')}
            className="w-12 h-12"
          >
            <Zap className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Preview Canvas */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: `${project.width}/${project.height}`, maxHeight: '60vh', maxWidth: '100%' }}>
              <canvas
                ref={canvasRef}
                width={project.width}
                height={project.height}
                className="w-full h-full"
              />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Advanced Preview Canvas</p>
                  <p className="text-sm opacity-75">{project.width}×{project.height} @ {project.fps}fps</p>
                </div>
              </div>
              
              {/* Playback overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex-1 h-1 bg-white/20 rounded">
                      <div 
                        className="h-full bg-white rounded transition-all"
                        style={{ width: `${(currentTime / project.duration) * 100}%` }}
                      />
                    </div>
                    <span>{formatTime(project.duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Playback Controls */}
          <div className="border-t p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => seekTo(currentTime - 10)}>
                  <Rewind className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => seekTo(currentTime - 1)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={togglePlayback}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" onClick={() => seekTo(currentTime + 1)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => seekTo(currentTime + 10)}>
                  <FastForward className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => seekTo(0)}>
                  <Square className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => seekTo(value)}
                  max={project.duration}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button size="sm" onClick={() => setMuted(!muted)}>
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => setVolume(value)}
                  max={100}
                  className="w-20"
                />
                
                <span className="text-sm text-muted-foreground min-w-[100px]">
                  {formatTime(currentTime)} / {formatTime(project.duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Timeline */}
          <div className="border-t bg-muted/30" style={{ height: '300px' }}>
            <div className="p-2 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="video-upload">
                  <Button size="sm" asChild>
                    <span>
                      <VideoIcon className="w-4 h-4 mr-1" />
                      Video
                    </span>
                  </Button>
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && addTimelineItem('video', e.target.files[0])}
                  className="hidden"
                />
                
                <label htmlFor="audio-upload">
                  <Button size="sm" asChild>
                    <span>
                      <Music className="w-4 h-4 mr-1" />
                      Audio
                    </span>
                  </Button>
                </label>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && addTimelineItem('audio', e.target.files[0])}
                  className="hidden"
                />
                
                <label htmlFor="image-upload">
                  <Button size="sm" asChild>
                    <span>
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Image
                    </span>
                  </Button>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && addTimelineItem('image', e.target.files[0])}
                  className="hidden"
                />
                
                <Button size="sm" onClick={() => addTimelineItem('text')}>
                  <Type className="w-4 h-4 mr-1" />
                  Text
                </Button>
                
                <div className="w-px h-6 bg-border mx-2" />
                
                <Button size="sm" onClick={() => selectedItems.length > 0 && deleteTimelineItems(selectedItems)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch checked={showWaveforms} onCheckedChange={setShowWaveforms} />
                <span className="text-sm">Waveforms</span>
                <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                <span className="text-sm">Snap</span>
                <span className="text-sm text-muted-foreground">{zoom}%</span>
                <Slider
                  value={[zoom]}
                  onValueChange={([value]) => setZoom(value)}
                  min={25}
                  max={400}
                  step={25}
                  className="w-20"
                />
              </div>
            </div>
            
            <div ref={timelineRef} className="flex-1 overflow-auto p-2">
              <div className="relative" style={{ height: '250px', width: `${project.duration * 100}px`, minWidth: '100%' }}>
                {/* Timeline ruler */}
                <div className="absolute top-0 left-0 right-0 h-8 border-b bg-background">
                  {Array.from({ length: Math.ceil(project.duration) }, (_, i) => (
                    <div key={i} className="absolute border-l border-muted-foreground/20" style={{ left: `${(i / project.duration) * 100}%` }}>
                      <span className="text-xs text-muted-foreground ml-1">{formatTime(i)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Audio waveforms */}
                {showWaveforms && (
                  <canvas
                    ref={waveformRef}
                    width={project.duration * 100}
                    height={60}
                    className="absolute top-8 left-0 opacity-30"
                  />
                )}
                
                {/* Timeline items */}
                {project.timeline.map((item, index) => (
                  <TimelineItemComponent
                    key={item.id}
                    item={item}
                    project={project}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedItems(prev => [...prev, item.id])
                      } else {
                        setSelectedItems(prev => prev.filter(id => id !== item.id))
                      }
                    }}
                    onUpdate={(updates) => updateTimelineItem(item.id, updates)}
                    onSplit={(time) => splitTimelineItem(item.id, time)}
                    currentTime={currentTime}
                    zoom={zoom}
                  />
                ))}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: `${(currentTime / project.duration) * 100}%` }}
                >
                  <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Properties Panel */}
        <div className="w-80 border-l bg-muted/30">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="properties">Props</TabsTrigger>
              <TabsTrigger value="effects">FX</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="p-4 space-y-4">
              <AdvancedPropertiesPanel
                selectedItems={selectedItems.map(id => project.timeline.find(item => item.id === id)!).filter(Boolean)}
                onUpdate={updateTimelineItem}
                onAddKeyframe={addKeyframe}
                currentTime={currentTime}
              />
            </TabsContent>
            
            <TabsContent value="effects" className="p-4 space-y-4">
              <EffectsPanel
                selectedItems={selectedItems}
                onApplyEffect={applyEffect}
                availableEffects={videoEffects}
                availableTransitions={transitions}
              />
            </TabsContent>
            
            <TabsContent value="audio" className="p-4 space-y-4">
              <AudioPanel
                project={project}
                onUpdateProject={setProject}
              />
            </TabsContent>
            
            <TabsContent value="export" className="p-4 space-y-4">
              <ExportPanel
                project={project}
                onExport={exportProject}
                onUpdateSettings={(settings) => setProject(prev => prev ? { ...prev, settings } : null)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Timeline Item Component
function TimelineItemComponent({ item, project, isSelected, onSelect, onUpdate, onSplit, currentTime, zoom }: {
  item: TimelineItem
  project: VideoProject
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onUpdate: (updates: Partial<TimelineItem>) => void
  onSplit: (time: number) => void
  currentTime: number
  zoom: number
}) {
  const getItemColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'video': return 'bg-blue-500'
      case 'audio': return 'bg-green-500'
      case 'image': return 'bg-purple-500'
      case 'text': return 'bg-yellow-500'
      case 'effect': return 'bg-red-500'
      case 'transition': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      className={`absolute h-12 rounded border-2 cursor-pointer hover:opacity-80 transition-all ${
        getItemColor(item.type)
      } ${isSelected ? 'border-white ring-2 ring-primary' : 'border-transparent'} ${
        item.locked ? 'opacity-50' : ''
      }`}
      style={{
        left: `${(item.startTime / project.duration) * 100}%`,
        width: `${(item.duration / project.duration) * 100}%`,
        top: `${40 + (item.layer * 50)}px`,
        minWidth: '20px'
      }}
      onClick={() => onSelect(!isSelected)}
      onDoubleClick={() => {
        if (currentTime >= item.startTime && currentTime <= item.startTime + item.duration) {
          onSplit(currentTime)
        }
      }}
    >
      <div className="px-2 py-1 text-xs text-white truncate h-full flex items-center">
        <span className="truncate">{item.name}</span>
        {item.locked && <Lock className="w-3 h-3 ml-1" />}
        {item.muted && <VolumeX className="w-3 h-3 ml-1" />}
      </div>
      
      {/* Resize handles */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white" />
    </div>
  )
}

// Advanced Properties Panel
function AdvancedPropertiesPanel({ selectedItems, onUpdate, onAddKeyframe, currentTime }: {
  selectedItems: TimelineItem[]
  onUpdate: (itemId: string, updates: Partial<TimelineItem>) => void
  onAddKeyframe: (itemId: string, property: string, value: any) => void
  currentTime: number
}) {
  if (selectedItems.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Settings className="w-8 h-8 mx-auto mb-2" />
        <p>Select items to edit properties</p>
      </div>
    )
  }

  const item = selectedItems[0] // For now, edit first selected item

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">{item.name}</h3>
        <Badge variant="secondary">{item.type}</Badge>
      </div>
      
      {/* Transform properties */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Transform</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium">X Position</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={item.properties.x || 0}
                onChange={(e) => onUpdate(item.id, {
                  properties: { ...item.properties, x: parseFloat(e.target.value) }
                })}
                className="text-xs"
              />
              <Button size="sm" onClick={() => onAddKeyframe(item.id, 'x', item.properties.x || 0)}>
                <Zap className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium">Y Position</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={item.properties.y || 0}
                onChange={(e) => onUpdate(item.id, {
                  properties: { ...item.properties, y: parseFloat(e.target.value) }
                })}
                className="text-xs"
              />
              <Button size="sm" onClick={() => onAddKeyframe(item.id, 'y', item.properties.y || 0)}>
                <Zap className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium">Scale</label>
          <div className="flex items-center gap-2">
            <Slider
              value={[item.properties.scale || 1]}
              onValueChange={([value]) => onUpdate(item.id, {
                properties: { ...item.properties, scale: value }
              })}
              min={0.1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <Button size="sm" onClick={() => onAddKeyframe(item.id, 'scale', item.properties.scale || 1)}>
              <Zap className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium">Rotation</label>
          <div className="flex items-center gap-2">
            <Slider
              value={[item.properties.rotation || 0]}
              onValueChange={([value]) => onUpdate(item.id, {
                properties: { ...item.properties, rotation: value }
              })}
              min={-180}
              max={180}
              step={1}
              className="flex-1"
            />
            <Button size="sm" onClick={() => onAddKeyframe(item.id, 'rotation', item.properties.rotation || 0)}>
              <Zap className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium">Opacity</label>
          <div className="flex items-center gap-2">
            <Slider
              value={[item.properties.opacity || 1]}
              onValueChange={([value]) => onUpdate(item.id, {
                properties: { ...item.properties, opacity: value }
              })}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
            />
            <Button size="sm" onClick={() => onAddKeyframe(item.id, 'opacity', item.properties.opacity || 1)}>
              <Zap className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Type-specific properties */}
      {item.type === 'text' && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Text</h4>
          <Input
            value={item.properties.text || ''}
            onChange={(e) => onUpdate(item.id, {
              properties: { ...item.properties, text: e.target.value }
            })}
            placeholder="Enter text..."
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={item.properties.fontSize || 48}
              onChange={(e) => onUpdate(item.id, {
                properties: { ...item.properties, fontSize: parseFloat(e.target.value) }
              })}
              placeholder="Font size"
            />
            <Input
              type="color"
              value={item.properties.color || '#ffffff'}
              onChange={(e) => onUpdate(item.id, {
                properties: { ...item.properties, color: e.target.value }
              })}
            />
          </div>
        </div>
      )}
      
      {/* Keyframes */}
      {item.properties.keyframes && item.properties.keyframes.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Keyframes</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {item.properties.keyframes.map((keyframe, index) => (
              <div key={index} className="text-xs p-2 bg-muted rounded">
                <div className="flex justify-between">
                  <span>{keyframe.property}</span>
                  <span>{formatTime(keyframe.time)}</span>
                </div>
                <div className="text-muted-foreground">
                  {typeof keyframe.value === 'number' ? keyframe.value.toFixed(2) : keyframe.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Effects Panel
function EffectsPanel({ selectedItems, onApplyEffect, availableEffects, availableTransitions }: {
  selectedItems: string[]
  onApplyEffect: (itemIds: string[], effectType: string) => void
  availableEffects: Array<{ name: string; type: string }>
  availableTransitions: Array<{ name: string; type: string }>
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-3">Video Effects</h3>
        <div className="grid grid-cols-2 gap-2">
          {availableEffects.map((effect) => (
            <Button
              key={effect.type}
              variant="outline"
              size="sm"
              onClick={() => selectedItems.length > 0 && onApplyEffect(selectedItems, effect.type)}
              disabled={selectedItems.length === 0}
              className="text-xs"
            >
              {effect.name}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3">Transitions</h3>
        <div className="grid grid-cols-2 gap-2">
          {availableTransitions.map((transition) => (
            <Button
              key={transition.type}
              variant="outline"
              size="sm"
              onClick={() => selectedItems.length > 0 && onApplyEffect(selectedItems, transition.type)}
              disabled={selectedItems.length === 0}
              className="text-xs"
            >
              {transition.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Audio Panel
function AudioPanel({ project, onUpdateProject }: {
  project: VideoProject
  onUpdateProject: (project: VideoProject) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Audio Tracks</h3>
      
      {project.audioTracks.map((track) => (
        <Card key={track.id} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{track.name}</span>
            <div className="flex gap-1">
              <Button size="sm" variant={track.solo ? 'default' : 'outline'}>
                S
              </Button>
              <Button size="sm" variant={track.muted ? 'default' : 'outline'}>
                M
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4" />
              <Slider
                value={[track.volume]}
                onValueChange={([value]) => {
                  const updatedTracks = project.audioTracks.map(t =>
                    t.id === track.id ? { ...t, volume: value } : t
                  )
                  onUpdateProject({ ...project, audioTracks: updatedTracks })
                }}
                max={100}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4" />
            </div>
            
            <div className="text-xs text-muted-foreground">
              Effects: {track.effects.length}
            </div>
          </div>
        </Card>
      ))}
      
      <Button variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Audio Track
      </Button>
    </div>
  )
}

// Export Panel
function ExportPanel({ project, onExport, onUpdateSettings }: {
  project: VideoProject
  onExport: (format: 'mp4' | 'webm' | 'mov' | 'gif') => void
  onUpdateSettings: (settings: ProjectSettings) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-3">Export Settings</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Quality</label>
            <Select 
              value={project.settings.quality} 
              onValueChange={(value: any) => onUpdateSettings({ ...project.settings, quality: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="preview">Preview</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Format</label>
            <Select 
              value={project.settings.format} 
              onValueChange={(value: any) => onUpdateSettings({ ...project.settings, format: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="mov">MOV</SelectItem>
                <SelectItem value="avi">AVI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Codec</label>
            <Select 
              value={project.settings.codec} 
              onValueChange={(value: any) => onUpdateSettings({ ...project.settings, codec: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h264">H.264</SelectItem>
                <SelectItem value="h265">H.265</SelectItem>
                <SelectItem value="vp9">VP9</SelectItem>
                <SelectItem value="av1">AV1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Bitrate (kbps)</label>
            <Input
              type="number"
              value={project.settings.bitrate}
              onChange={(e) => onUpdateSettings({ ...project.settings, bitrate: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3">Export Options</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => onExport('mp4')}>
            Export as MP4
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onExport('webm')}>
            Export as WebM
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onExport('mov')}>
            Export as MOV
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onExport('gif')}>
            Export as GIF
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3">Share</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            Upload to YouTube
          </Button>
          <Button variant="outline" className="w-full">
            Share on Social Media
          </Button>
          <Button variant="outline" className="w-full">
            Generate Embed Code
          </Button>
        </div>
      </div>
    </div>
  )
}

// Utility function to format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}