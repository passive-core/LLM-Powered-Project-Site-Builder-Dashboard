import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Palette, Image, Video, Wand2, Upload, Download, Share2, Play, Pause, RotateCcw } from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface DesignAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'animation' | 'template' | 'font' | 'color_palette'
  url: string
  thumbnailUrl?: string
  tags: string[]
  metadata: Record<string, any>
  source: 'canva' | 'generated' | 'uploaded' | 'youtube' | 'custom'
  projectId?: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface MediaProject {
  id: string
  title: string
  type: 'cartoon' | 'video' | 'animation' | 'social_post' | 'website'
  content?: string
  assets: string[]
  status: 'draft' | 'rendering' | 'completed' | 'published'
  outputUrl?: string
  thumbnailUrl?: string
  projectId?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export default function DesignStudio() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<DesignAsset[]>([])
  const [mediaProjects, setMediaProjects] = useState<MediaProject[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('assets')

  useEffect(() => {
    if (user) {
      loadAssets()
      loadMediaProjects()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAssets = async () => {
    try {
      const data = await blink.db.designAssets.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setAssets(data.map(asset => ({
        ...asset,
        tags: JSON.parse(asset.tags || '[]'),
        metadata: JSON.parse(asset.metadata || '{}')
      })))
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const loadMediaProjects = async () => {
    try {
      const data = await blink.db.mediaProjects.list({
        where: { userId: user?.id },
        orderBy: { updatedAt: 'desc' }
      })
      setMediaProjects(data.map(project => ({
        ...project,
        assets: JSON.parse(project.assets || '[]')
      })))
    } catch (error) {
      console.error('Failed to load media projects:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !user) return

    for (const file of Array.from(files)) {
      try {
        setUploadProgress(0)
        const { publicUrl } = await blink.storage.upload(
          file,
          `design-assets/${user.id}/${file.name}`,
          {
            upsert: true,
            onProgress: (percent) => setUploadProgress(percent)
          }
        )

        const asset: Partial<DesignAsset> = {
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: publicUrl,
          tags: [],
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          },
          source: 'uploaded',
          userId: user.id
        }

        await blink.db.designAssets.create({
          ...asset,
          tags: JSON.stringify(asset.tags),
          metadata: JSON.stringify(asset.metadata)
        })

        toast.success(`Uploaded ${file.name}`)
        loadAssets()
      } catch (error) {
        console.error('Upload failed:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploadProgress(0)
  }

  const generateWithAI = async (type: 'image' | 'video' | 'animation', prompt: string) => {
    if (!user) return

    try {
      setIsCreating(true)
      
      if (type === 'image') {
        const { data } = await blink.ai.generateImage({
          prompt,
          size: '1024x1024',
          quality: 'high',
          n: 1
        })

        const asset: Partial<DesignAsset> = {
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `AI Generated: ${prompt.slice(0, 30)}...`,
          type: 'image',
          url: data[0].url,
          tags: ['ai-generated'],
          metadata: { prompt, model: 'dall-e-3' },
          source: 'generated',
          userId: user.id
        }

        await blink.db.designAssets.create({
          ...asset,
          tags: JSON.stringify(asset.tags),
          metadata: JSON.stringify(asset.metadata)
        })

        toast.success('AI image generated!')
        loadAssets()
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      toast.error('Failed to generate content')
    } finally {
      setIsCreating(false)
    }
  }

  const createMediaProject = async (type: MediaProject['type'], title: string) => {
    if (!user) return

    try {
      const project: Partial<MediaProject> = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        type,
        content: JSON.stringify({ timeline: [], layers: [] }),
        assets: selectedAssets,
        status: 'draft',
        userId: user.id
      }

      await blink.db.mediaProjects.create({
        ...project,
        assets: JSON.stringify(project.assets)
      })

      toast.success(`Created ${type} project: ${title}`)
      loadMediaProjects()
      setSelectedAssets([])
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    }
  }

  const connectCanva = async () => {
    // Placeholder for Canva Pro integration
    toast.info('Canva Pro integration coming soon!')
  }

  const exportToYouTube = async (projectId: string) => {
    // Placeholder for YouTube export
    toast.info('YouTube export coming soon!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design Studio</h1>
          <p className="text-muted-foreground">Create stunning visuals, videos, and animations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={connectCanva} variant="outline">
            <Palette className="w-4 h-4 mr-2" />
            Connect Canva Pro
          </Button>
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload Assets
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {uploadProgress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Progress value={uploadProgress} className="flex-1" />
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets">Asset Library</TabsTrigger>
          <TabsTrigger value="create">AI Creator</TabsTrigger>
          <TabsTrigger value="projects">Media Projects</TabsTrigger>
          <TabsTrigger value="social">Social Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    {asset.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {asset.type}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (selectedAssets.includes(asset.id)) {
                            setSelectedAssets(prev => prev.filter(id => id !== asset.id))
                          } else {
                            setSelectedAssets(prev => [...prev, asset.id])
                          }
                        }}
                        className={selectedAssets.includes(asset.id) ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {selectedAssets.includes(asset.id) ? '✓' : '+'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AICreatorCard
              title="AI Image Generator"
              description="Create stunning images from text prompts"
              icon={<Image className="w-6 h-6" />}
              onGenerate={(prompt) => generateWithAI('image', prompt)}
              isLoading={isCreating}
            />
            <AICreatorCard
              title="Video Creator"
              description="Generate videos and animations"
              icon={<Video className="w-6 h-6" />}
              onGenerate={(prompt) => generateWithAI('video', prompt)}
              isLoading={isCreating}
            />
            <AICreatorCard
              title="Cartoon Maker"
              description="Create animated cartoons and characters"
              icon={<Wand2 className="w-6 h-6" />}
              onGenerate={(prompt) => generateWithAI('animation', prompt)}
              isLoading={isCreating}
            />
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Video className="w-4 h-4 mr-2" />
                  New Video Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Media Project</DialogTitle>
                </DialogHeader>
                <CreateProjectForm onSubmit={createMediaProject} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                    {project.thumbnailUrl ? (
                      <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{project.type}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Play className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {project.status === 'completed' && (
                      <Button size="sm" onClick={() => exportToYouTube(project.id)}>
                        <Share2 className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Platform Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  Connect Facebook
                </Button>
                <Button className="w-full" variant="outline">
                  Connect YouTube
                </Button>
                <Button className="w-full" variant="outline">
                  Connect Instagram
                </Button>
                <Button className="w-full" variant="outline">
                  Connect Twitter
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cross-Site Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enable Chat Widget</label>
                  <Button variant="outline" className="w-full">
                    Deploy to All Sites
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Social Feed Integration</label>
                  <Button variant="outline" className="w-full">
                    Configure Feed
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Universal Comments</label>
                  <Button variant="outline" className="w-full">
                    Enable Comments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AICreatorCard({ title, description, icon, onGenerate, isLoading }: {
  title: string
  description: string
  icon: React.ReactNode
  onGenerate: (prompt: string) => void
  isLoading: boolean
}) {
  const [prompt, setPrompt] = useState('')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe what you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
        <Button
          onClick={() => onGenerate(prompt)}
          disabled={!prompt.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function CreateProjectForm({ onSubmit }: {
  onSubmit: (type: MediaProject['type'], title: string) => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MediaProject['type']>('video')

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Project Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter project title..."
        />
      </div>
      <div>
        <label className="text-sm font-medium">Project Type</label>
        <Select value={type} onValueChange={(value) => setType(value as MediaProject['type'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="cartoon">Cartoon</SelectItem>
            <SelectItem value="animation">Animation</SelectItem>
            <SelectItem value="social_post">Social Post</SelectItem>
            <SelectItem value="website">Website</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => onSubmit(type, title)}
        disabled={!title.trim()}
        className="w-full"
      >
        Create Project
      </Button>
    </div>
  )
}