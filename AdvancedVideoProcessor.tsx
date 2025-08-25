import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Slider } from './ui/slider'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import { useToast } from '../hooks/use-toast'
import { 
  Play, Pause, Square, Upload, Download, Scissors, Volume2, 
  Sun, Contrast, Palette, Zap, Film, Music, 
  RotateCcw, Crop, Filter, Layers, Settings
} from 'lucide-react'
import blink from '../blink/client'

interface VideoFile {
  id: string
  name: string
  url: string
  duration: number
  size: number
  format: string
  resolution: { width: number; height: number }
  fps: number
}

interface VideoEffect {
  id: string
  name: string
  type: 'filter' | 'transition' | 'overlay' | 'audio'
  parameters: Record<string, any>
}

interface ProcessingJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  outputUrl?: string
  error?: string
}

export function AdvancedVideoProcessor() {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([])
  const [effects, setEffects] = useState<VideoEffect[]>([])
  const [loading, setLoading] = useState(false)
  
  // Video processing parameters
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [cropSettings, setCropSettings] = useState({ x: 0, y: 0, width: 100, height: 100 })
  const [outputFormat, setOutputFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadVideoFiles()
  }, [])

  const loadVideoFiles = async () => {
    try {
      const assets = await blink.db.designAssets.list({
        where: { type: 'video' }
      })
      
      const videoFiles = assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        url: asset.url,
        duration: JSON.parse(asset.metadata || '{}').duration || 0,
        size: JSON.parse(asset.metadata || '{}').size || 0,
        format: JSON.parse(asset.metadata || '{}').format || 'mp4',
        resolution: JSON.parse(asset.metadata || '{}').resolution || { width: 1920, height: 1080 },
        fps: JSON.parse(asset.metadata || '{}').fps || 30
      }))
      
      setVideoFiles(videoFiles)
    } catch (error) {
      console.error('Error loading video files:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setLoading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('video/')) {
          // Upload to storage
          const { publicUrl } = await blink.storage.upload(
            file,
            `videos/${file.name}`,
            { upsert: true }
          )
          
          // Get video metadata using a temporary video element
          const video = document.createElement('video')
          video.src = URL.createObjectURL(file)
          
          await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              const metadata = {
                duration: video.duration,
                size: file.size,
                format: file.type.split('/')[1],
                resolution: { width: video.videoWidth, height: video.videoHeight },
                fps: 30 // Default, would need more complex detection
              }
              
              // Save to database
              blink.db.designAssets.create({
                name: file.name,
                type: 'video',
                url: publicUrl,
                metadata: JSON.stringify(metadata)
              })
              
              resolve(null)
            }
          })
          
          URL.revokeObjectURL(video.src)
        }
      }
      
      await loadVideoFiles()
      toast({
        title: 'Upload Complete',
        description: `${files.length} video(s) uploaded successfully.`
      })
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload videos. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const processVideo = async (operations: string[]) => {
    if (!selectedVideo) return
    
    setLoading(true)
    const jobId = `job_${Date.now()}`
    
    try {
      // Create processing job
      const job: ProcessingJob = {
        id: jobId,
        status: 'queued',
        progress: 0
      }
      setProcessingJobs(prev => [...prev, job])
      
      // Call our video processing edge function
      const response = await blink.data.fetch({
        url: '/api/process-video', // Our edge function endpoint
        method: 'POST',
        body: {
          videoUrl: selectedVideo.url,
          operations: operations,
          parameters: {
            brightness: brightness / 100,
            contrast: contrast / 100,
            saturation: saturation / 100,
            crop: cropSettings,
            outputFormat,
            quality
          },
          jobId
        }
      })
      
      if (response.status === 200) {
        // Start polling for job status
        pollJobStatus(jobId)
        
        toast({
          title: 'Processing Started',
          description: 'Your video is being processed. This may take a few minutes.'
        })
      }
    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Failed to start video processing. Please try again.',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await blink.data.fetch({
          url: `/api/job-status/${jobId}`,
          method: 'GET'
        })
        
        if (response.status === 200) {
          const jobStatus = response.body
          
          setProcessingJobs(prev => 
            prev.map(job => 
              job.id === jobId 
                ? { ...job, ...jobStatus }
                : job
            )
          )
          
          if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
            clearInterval(interval)
            setLoading(false)
            
            if (jobStatus.status === 'completed') {
              toast({
                title: 'Processing Complete',
                description: 'Your video has been processed successfully.'
              })
            } else {
              toast({
                title: 'Processing Failed',
                description: jobStatus.error || 'Video processing failed.',
                variant: 'destructive'
              })
            }
          }
        }
      } catch (error) {
        clearInterval(interval)
        setLoading(false)
      }
    }, 2000)
  }

  const applyRealTimeFilter = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const drawFrame = () => {
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      if (!video.paused && !video.ended) {
        requestAnimationFrame(drawFrame)
      }
    }
    
    drawFrame()
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
      applyRealTimeFilter()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const availableOperations = [
    { id: 'trim', name: 'Trim Video', icon: Scissors },
    { id: 'resize', name: 'Resize/Scale', icon: Crop },
    { id: 'rotate', name: 'Rotate', icon: RotateCcw },
    { id: 'filters', name: 'Apply Filters', icon: Filter },
    { id: 'audio', name: 'Audio Processing', icon: Music },
    { id: 'compress', name: 'Compress', icon: Zap }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Video Processor</h2>
          <p className="text-muted-foreground">Professional video editing with real-time processing</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="video-upload"
          />
          <Button asChild>
            <label htmlFor="video-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload Videos
            </label>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Video Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {videoFiles.map((video) => (
                  <div
                    key={video.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVideo?.id === video.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <h4 className="font-medium text-sm">{video.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {video.format.toUpperCase()}
                      </Badge>
                      <span>{video.resolution.width}×{video.resolution.height}</span>
                      <span>{formatTime(video.duration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Video Player & Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVideo ? (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={selectedVideo.url}
                    className="w-full h-auto max-h-96"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ display: brightness !== 100 || contrast !== 100 || saturation !== 100 ? 'block' : 'none' }}
                  />
                </div>
                
                {/* Video Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.pause()
                          videoRef.current.currentTime = 0
                          setIsPlaying(false)
                        }
                      }}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-muted-foreground">
                        {formatTime(currentTime)}
                      </span>
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {formatTime(duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <Slider
                        value={[volume]}
                        max={100}
                        step={1}
                        onValueChange={(value) => {
                          setVolume(value[0])
                          if (videoRef.current) {
                            videoRef.current.volume = value[0] / 100
                          }
                        }}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a video from the library to start editing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedVideo && (
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="crop">Crop & Resize</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brightness4 className="w-5 h-5" />
                  Color Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brightness: {brightness}%</label>
                  <Slider
                    value={[brightness]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setBrightness(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contrast: {contrast}%</label>
                  <Slider
                    value={[contrast]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setContrast(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Saturation: {saturation}%</label>
                  <Slider
                    value={[saturation]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setSaturation(value[0])}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setBrightness(100)
                      setContrast(100)
                      setSaturation(100)
                    }}
                  >
                    Reset
                  </Button>
                  <Button onClick={applyRealTimeFilter}>
                    Apply Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crop" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crop className="w-5 h-5" />
                  Crop & Resize Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">X Position: {cropSettings.x}%</label>
                    <Slider
                      value={[cropSettings.x]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setCropSettings(prev => ({ ...prev, x: value[0] }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y Position: {cropSettings.y}%</label>
                    <Slider
                      value={[cropSettings.y]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setCropSettings(prev => ({ ...prev, y: value[0] }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Width: {cropSettings.width}%</label>
                    <Slider
                      value={[cropSettings.width]}
                      min={10}
                      max={100}
                      step={1}
                      onValueChange={(value) => setCropSettings(prev => ({ ...prev, width: value[0] }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Height: {cropSettings.height}%</label>
                    <Slider
                      value={[cropSettings.height]}
                      min={10}
                      max={100}
                      step={1}
                      onValueChange={(value) => setCropSettings(prev => ({ ...prev, height: value[0] }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Audio Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Audio Tools</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced audio processing features including noise reduction, 
                    equalization, and audio effects.
                  </p>
                  <Button>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Audio Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format</label>
                    <select 
                      value={outputFormat} 
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="mp4">MP4 (H.264)</option>
                      <option value="webm">WebM (VP9)</option>
                      <option value="mov">MOV (QuickTime)</option>
                      <option value="avi">AVI</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quality</label>
                    <select 
                      value={quality} 
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Slow)</option>
                      <option value="lossless">Lossless</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {availableOperations.map((operation) => {
                    const Icon = operation.icon
                    return (
                      <Button
                        key={operation.id}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => processVideo([operation.id])}
                        disabled={loading}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm">{operation.name}</span>
                      </Button>
                    )
                  })}
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => processVideo(['filters', 'crop', 'export'])}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Process & Export Video'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Processing Jobs */}
      {processingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Job {job.id}</span>
                      <Badge 
                        variant={job.status === 'completed' ? 'default' : 
                                job.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.progress}% complete
                    </p>
                  </div>
                  {job.outputUrl && (
                    <Button asChild size="sm">
                      <a href={job.outputUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}