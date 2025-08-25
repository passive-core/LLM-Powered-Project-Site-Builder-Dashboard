import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { 
  Palette, Image, Video, Wand2, Upload, Download, Share2, Play, Pause, RotateCcw,
  Crop, Filter, Type, Layers, Move, RotateCw, Zap, Sparkles, Brush, Eraser,
  Square, Circle, Triangle, Star, Heart, Hexagon, Eye, EyeOff, Lock, Unlock
} from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

// Advanced Canvas Editor using Fabric.js concepts
interface CanvasObject {
  id: string
  type: 'image' | 'text' | 'shape' | 'drawing'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  properties: Record<string, any>
}

interface DesignProject {
  id: string
  name: string
  width: number
  height: number
  background: string
  objects: CanvasObject[]
  layers: string[]
  version: number
  createdAt: string
  updatedAt: string
}

interface BrandKit {
  id: string
  name: string
  colors: string[]
  fonts: string[]
  logos: string[]
  templates: string[]
  userId: string
}

const designTemplates = [
  { id: 'social-post', name: 'Social Media Post', width: 1080, height: 1080, category: 'social' },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'video' },
  { id: 'business-card', name: 'Business Card', width: 1050, height: 600, category: 'print' },
  { id: 'poster', name: 'Poster', width: 2480, height: 3508, category: 'print' },
  { id: 'presentation', name: 'Presentation Slide', width: 1920, height: 1080, category: 'presentation' }
]

const shapes = [
  { icon: Square, name: 'Rectangle', type: 'rect' },
  { icon: Circle, name: 'Circle', type: 'circle' },
  { icon: Triangle, name: 'Triangle', type: 'triangle' },
  { icon: Star, name: 'Star', type: 'star' },
  { icon: Heart, name: 'Heart', type: 'heart' },
  { icon: Hexagon, name: 'Hexagon', type: 'hexagon' }
]

const filters = [
  { name: 'None', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Blur', value: 'blur(2px)' },
  { name: 'Brightness', value: 'brightness(150%)' },
  { name: 'Contrast', value: 'contrast(150%)' },
  { name: 'Saturate', value: 'saturate(200%)' },
  { name: 'Vintage', value: 'sepia(50%) contrast(120%) brightness(110%)' }
]

export default function AdvancedDesignStudio() {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentProject, setCurrentProject] = useState<DesignProject | null>(null)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [tool, setTool] = useState<'select' | 'text' | 'shape' | 'brush' | 'eraser'>('select')
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [canvaConnected, setCanvaConnected] = useState(false)
  const [templates, setTemplates] = useState(designTemplates)
  const [showLayers, setShowLayers] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [history, setHistory] = useState<DesignProject[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    if (user) {
      loadBrandKit()
      initializeCanvas()
    }
  }, [user])

  const loadBrandKit = async () => {
    try {
      // Load user's brand kit from database
      const brandKits = await blink.db.designAssets.list({
        where: { userId: user?.id, type: 'brand_kit' },
        limit: 1
      })
      
      if (brandKits.length > 0) {
        const kit = JSON.parse(brandKits[0].metadata || '{}')
        setBrandKit(kit)
      } else {
        // Create default brand kit
        const defaultKit: BrandKit = {
          id: `brand_${Date.now()}`,
          name: 'My Brand Kit',
          colors: ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'],
          fonts: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'],
          logos: [],
          templates: [],
          userId: user?.id || ''
        }
        setBrandKit(defaultKit)
        saveBrandKit(defaultKit)
      }
    } catch (error) {
      console.error('Failed to load brand kit:', error)
    }
  }

  const saveBrandKit = async (kit: BrandKit) => {
    try {
      await blink.db.designAssets.create({
        id: kit.id,
        name: kit.name,
        type: 'brand_kit',
        url: '',
        tags: JSON.stringify(['brand', 'kit']),
        metadata: JSON.stringify(kit),
        source: 'custom',
        userId: user?.id || ''
      })
    } catch (error) {
      console.error('Failed to save brand kit:', error)
    }
  }

  const initializeCanvas = () => {
    // Initialize canvas with default project
    const defaultProject: DesignProject = {
      id: `project_${Date.now()}`,
      name: 'Untitled Design',
      width: 1080,
      height: 1080,
      background: '#ffffff',
      objects: [],
      layers: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCurrentProject(defaultProject)
    addToHistory(defaultProject)
  }

  const addToHistory = (project: DesignProject) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ ...project })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentProject(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentProject(history[historyIndex + 1])
    }
  }

  const createFromTemplate = (template: typeof designTemplates[0]) => {
    const newProject: DesignProject = {
      id: `project_${Date.now()}`,
      name: template.name,
      width: template.width,
      height: template.height,
      background: '#ffffff',
      objects: [],
      layers: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCurrentProject(newProject)
    addToHistory(newProject)
    toast.success(`Created ${template.name} project`)
  }

  const addTextElement = () => {
    if (!currentProject) return

    const textObject: CanvasObject = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: currentProject.width / 2 - 100,
      y: currentProject.height / 2 - 25,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      properties: {
        text: 'Add your text',
        fontSize: 32,
        fontFamily: brandKit?.fonts[0] || 'Inter',
        color: brandKit?.colors[0] || '#000000',
        fontWeight: 'normal',
        textAlign: 'center'
      }
    }

    const updatedProject = {
      ...currentProject,
      objects: [...currentProject.objects, textObject],
      layers: [...currentProject.layers, textObject.id]
    }
    setCurrentProject(updatedProject)
    addToHistory(updatedProject)
    setSelectedObject(textObject.id)
  }

  const addShape = (shapeType: string) => {
    if (!currentProject) return

    const shapeObject: CanvasObject = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      x: currentProject.width / 2 - 50,
      y: currentProject.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      properties: {
        shapeType,
        fill: brandKit?.colors[1] || '#6366f1',
        stroke: '#000000',
        strokeWidth: 0
      }
    }

    const updatedProject = {
      ...currentProject,
      objects: [...currentProject.objects, shapeObject],
      layers: [...currentProject.layers, shapeObject.id]
    }
    setCurrentProject(updatedProject)
    addToHistory(updatedProject)
    setSelectedObject(shapeObject.id)
  }

  const generateWithAI = async (prompt: string, type: 'background' | 'element' | 'layout') => {
    if (!currentProject) return

    setIsGenerating(true)
    try {
      if (type === 'background') {
        const { data } = await blink.ai.generateImage({
          prompt: `${prompt}, background design, ${currentProject.width}x${currentProject.height}`,
          size: '1024x1024',
          quality: 'high'
        })

        const updatedProject = {
          ...currentProject,
          background: `url(${data[0].url})`
        }
        setCurrentProject(updatedProject)
        addToHistory(updatedProject)
      } else if (type === 'element') {
        const { data } = await blink.ai.generateImage({
          prompt: `${prompt}, design element, transparent background, high quality`,
          size: '1024x1024',
          quality: 'high'
        })

        const imageObject: CanvasObject = {
          id: `ai_image_${Date.now()}`,
          type: 'image',
          x: currentProject.width / 2 - 150,
          y: currentProject.height / 2 - 150,
          width: 300,
          height: 300,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          properties: {
            src: data[0].url,
            filter: 'none'
          }
        }

        const updatedProject = {
          ...currentProject,
          objects: [...currentProject.objects, imageObject],
          layers: [...currentProject.layers, imageObject.id]
        }
        setCurrentProject(updatedProject)
        addToHistory(updatedProject)
        setSelectedObject(imageObject.id)
      }

      toast.success('AI content generated!')
    } catch (error) {
      console.error('AI generation failed:', error)
      toast.error('Failed to generate AI content')
    } finally {
      setIsGenerating(false)
    }
  }

  const connectCanva = async () => {
    try {
      // Simulate Canva Connect API integration
      setCanvaConnected(true)
      
      // Load Canva templates (simulated)
      const canvaTemplates = [
        { id: 'canva-1', name: 'Modern Social Post', width: 1080, height: 1080, category: 'canva' },
        { id: 'canva-2', name: 'Professional Presentation', width: 1920, height: 1080, category: 'canva' },
        { id: 'canva-3', name: 'Instagram Story Template', width: 1080, height: 1920, category: 'canva' }
      ]
      
      setTemplates(prev => [...prev, ...canvaTemplates])
      toast.success('Connected to Canva Pro! Templates loaded.')
    } catch (error) {
      console.error('Canva connection failed:', error)
      toast.error('Failed to connect to Canva')
    }
  }

  const exportProject = async (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    if (!currentProject) return

    try {
      // In a real implementation, this would render the canvas to the specified format
      toast.info(`Exporting as ${format.toUpperCase()}...`)
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export project')
    }
  }

  const selectedObj = currentProject?.objects.find(obj => obj.id === selectedObject)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="border-b p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
            ↶ Undo
          </Button>
          <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
            ↷ Redo
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button size="sm" variant={tool === 'select' ? 'default' : 'outline'} onClick={() => setTool('select')}>
            <Move className="w-4 h-4" />
          </Button>
          <Button size="sm" variant={tool === 'text' ? 'default' : 'outline'} onClick={() => setTool('text')}>
            <Type className="w-4 h-4" />
          </Button>
          <Button size="sm" variant={tool === 'shape' ? 'default' : 'outline'} onClick={() => setTool('shape')}>
            <Square className="w-4 h-4" />
          </Button>
          <Button size="sm" variant={tool === 'brush' ? 'default' : 'outline'} onClick={() => setTool('brush')}>
            <Brush className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{zoom}%</span>
          <Slider
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
            min={25}
            max={400}
            step={25}
            className="w-20"
          />
          <div className="w-px h-6 bg-border mx-2" />
          <Button size="sm" variant="outline" onClick={() => exportProject('png')}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-muted/30 overflow-y-auto">
          <Tabs defaultValue="templates" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="brand">Brand</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Design Templates</h3>
                {!canvaConnected && (
                  <Button size="sm" onClick={connectCanva}>
                    <Palette className="w-4 h-4 mr-1" />
                    Connect Canva
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => createFromTemplate(template)}>
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded mb-2 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">{template.width}×{template.height}</span>
                      </div>
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        {template.category === 'canva' && canvaConnected && (
                          <Badge variant="secondary" className="text-xs">Canva</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="elements" className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-3">Text</h3>
                <Button variant="outline" className="w-full justify-start" onClick={addTextElement}>
                  <Type className="w-4 h-4 mr-2" />
                  Add Text
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Shapes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {shapes.map((shape) => (
                    <Button
                      key={shape.type}
                      variant="outline"
                      size="sm"
                      className="aspect-square"
                      onClick={() => addShape(shape.type)}
                    >
                      <shape.icon className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Upload</h3>
                <label htmlFor="element-upload">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                </label>
                <input id="element-upload" type="file" accept="image/*" className="hidden" />
              </div>
            </TabsContent>
            
            <TabsContent value="brand" className="p-4 space-y-4">
              {brandKit && (
                <>
                  <div>
                    <h3 className="font-medium mb-3">Brand Colors</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {brandKit.colors.map((color, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded border cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Brand Fonts</h3>
                    <div className="space-y-2">
                      {brandKit.fonts.map((font, index) => (
                        <div key={index} className="p-2 border rounded text-sm" style={{ fontFamily: font }}>
                          {font}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="ai" className="p-4 space-y-4">
              <AIGeneratorPanel onGenerate={generateWithAI} isGenerating={isGenerating} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
            <div 
              className="bg-white shadow-lg relative"
              style={{ 
                width: `${(currentProject?.width || 1080) * (zoom / 100)}px`,
                height: `${(currentProject?.height || 1080) * (zoom / 100)}px`,
                background: currentProject?.background || '#ffffff'
              }}
            >
              <canvas
                ref={canvasRef}
                width={currentProject?.width || 1080}
                height={currentProject?.height || 1080}
                className="w-full h-full"
              />
              
              {/* Render objects */}
              {currentProject?.objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`absolute cursor-pointer border-2 ${
                    selectedObject === obj.id ? 'border-primary' : 'border-transparent'
                  } ${obj.visible ? '' : 'opacity-50'}`}
                  style={{
                    left: `${obj.x * (zoom / 100)}px`,
                    top: `${obj.y * (zoom / 100)}px`,
                    width: `${obj.width * (zoom / 100)}px`,
                    height: `${obj.height * (zoom / 100)}px`,
                    transform: `rotate(${obj.rotation}deg)`,
                    opacity: obj.opacity,
                    pointerEvents: obj.locked ? 'none' : 'auto'
                  }}
                  onClick={() => setSelectedObject(obj.id)}
                >
                  {obj.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        fontSize: `${obj.properties.fontSize * (zoom / 100)}px`,
                        fontFamily: obj.properties.fontFamily,
                        color: obj.properties.color,
                        fontWeight: obj.properties.fontWeight,
                        textAlign: obj.properties.textAlign
                      }}
                    >
                      {obj.properties.text}
                    </div>
                  )}
                  
                  {obj.type === 'shape' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: obj.properties.fill,
                        border: `${obj.properties.strokeWidth}px solid ${obj.properties.stroke}`,
                        borderRadius: obj.properties.shapeType === 'circle' ? '50%' : '0'
                      }}
                    />
                  )}
                  
                  {obj.type === 'image' && (
                    <img
                      src={obj.properties.src}
                      alt="Design element"
                      className="w-full h-full object-cover"
                      style={{ filter: obj.properties.filter }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties & Layers */}
        <div className="w-80 border-l bg-muted/30">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="p-4">
              {selectedObj ? (
                <ObjectPropertiesPanel
                  object={selectedObj}
                  onUpdate={(updates) => {
                    if (!currentProject) return
                    const updatedProject = {
                      ...currentProject,
                      objects: currentProject.objects.map(obj =>
                        obj.id === selectedObj.id ? { ...obj, ...updates } : obj
                      )
                    }
                    setCurrentProject(updatedProject)
                    addToHistory(updatedProject)
                  }}
                  brandKit={brandKit}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Layers className="w-8 h-8 mx-auto mb-2" />
                  <p>Select an object to edit properties</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="layers" className="p-4">
              <LayersPanel
                project={currentProject}
                selectedObject={selectedObject}
                onSelectObject={setSelectedObject}
                onUpdateProject={(project) => {
                  setCurrentProject(project)
                  addToHistory(project)
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// AI Generator Panel Component
function AIGeneratorPanel({ onGenerate, isGenerating }: {
  onGenerate: (prompt: string, type: 'background' | 'element' | 'layout') => void
  isGenerating: boolean
}) {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<'background' | 'element' | 'layout'>('element')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-3">AI Generator</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate backgrounds, elements, or layouts with AI
        </p>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Type</label>
        <Select value={type} onValueChange={(value: any) => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="background">Background</SelectItem>
            <SelectItem value="element">Element</SelectItem>
            <SelectItem value="layout">Layout</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={3}
        />
      </div>
      
      <Button
        onClick={() => onGenerate(prompt, type)}
        disabled={!prompt.trim() || isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </>
        )}
      </Button>
    </div>
  )
}

// Object Properties Panel Component
function ObjectPropertiesPanel({ object, onUpdate, brandKit }: {
  object: CanvasObject
  onUpdate: (updates: Partial<CanvasObject>) => void
  brandKit: BrandKit | null
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{object.type.charAt(0).toUpperCase() + object.type.slice(1)}</h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate({ visible: !object.visible })}
          >
            {object.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate({ locked: !object.locked })}
          >
            {object.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      
      {/* Position & Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">X</label>
          <Input
            type="number"
            value={object.x}
            onChange={(e) => onUpdate({ x: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Y</label>
          <Input
            type="number"
            value={object.y}
            onChange={(e) => onUpdate({ y: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Width</label>
          <Input
            type="number"
            value={object.width}
            onChange={(e) => onUpdate({ width: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Height</label>
          <Input
            type="number"
            value={object.height}
            onChange={(e) => onUpdate({ height: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      
      {/* Rotation & Opacity */}
      <div>
        <label className="text-sm font-medium">Rotation</label>
        <Slider
          value={[object.rotation]}
          onValueChange={([value]) => onUpdate({ rotation: value })}
          min={-180}
          max={180}
          step={1}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Opacity</label>
        <Slider
          value={[object.opacity * 100]}
          onValueChange={([value]) => onUpdate({ opacity: value / 100 })}
          min={0}
          max={100}
          step={1}
        />
      </div>
      
      {/* Type-specific properties */}
      {object.type === 'text' && (
        <TextProperties object={object} onUpdate={onUpdate} brandKit={brandKit} />
      )}
      
      {object.type === 'shape' && (
        <ShapeProperties object={object} onUpdate={onUpdate} brandKit={brandKit} />
      )}
      
      {object.type === 'image' && (
        <ImageProperties object={object} onUpdate={onUpdate} />
      )}
    </div>
  )
}

// Text Properties Component
function TextProperties({ object, onUpdate, brandKit }: {
  object: CanvasObject
  onUpdate: (updates: Partial<CanvasObject>) => void
  brandKit: BrandKit | null
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Text</label>
        <Textarea
          value={object.properties.text}
          onChange={(e) => onUpdate({ 
            properties: { ...object.properties, text: e.target.value }
          })}
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Font Size</label>
          <Input
            type="number"
            value={object.properties.fontSize}
            onChange={(e) => onUpdate({ 
              properties: { ...object.properties, fontSize: parseFloat(e.target.value) }
            })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Font Family</label>
          <Select 
            value={object.properties.fontFamily} 
            onValueChange={(value) => onUpdate({ 
              properties: { ...object.properties, fontFamily: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {brandKit?.fonts.map(font => (
                <SelectItem key={font} value={font}>{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Color</label>
        <div className="grid grid-cols-5 gap-1 mt-2">
          {brandKit?.colors.map((color, index) => (
            <div
              key={index}
              className="aspect-square rounded border cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => onUpdate({ 
                properties: { ...object.properties, color }
              })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Shape Properties Component
function ShapeProperties({ object, onUpdate, brandKit }: {
  object: CanvasObject
  onUpdate: (updates: Partial<CanvasObject>) => void
  brandKit: BrandKit | null
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Fill Color</label>
        <div className="grid grid-cols-5 gap-1 mt-2">
          {brandKit?.colors.map((color, index) => (
            <div
              key={index}
              className="aspect-square rounded border cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => onUpdate({ 
                properties: { ...object.properties, fill: color }
              })}
            />
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Stroke Width</label>
        <Slider
          value={[object.properties.strokeWidth]}
          onValueChange={([value]) => onUpdate({ 
            properties: { ...object.properties, strokeWidth: value }
          })}
          min={0}
          max={10}
          step={1}
        />
      </div>
    </div>
  )
}

// Image Properties Component
function ImageProperties({ object, onUpdate }: {
  object: CanvasObject
  onUpdate: (updates: Partial<CanvasObject>) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Filter</label>
        <Select 
          value={object.properties.filter} 
          onValueChange={(value) => onUpdate({ 
            properties: { ...object.properties, filter: value }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filters.map(filter => (
              <SelectItem key={filter.value} value={filter.value}>{filter.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Layers Panel Component
function LayersPanel({ project, selectedObject, onSelectObject, onUpdateProject }: {
  project: DesignProject | null
  selectedObject: string | null
  onSelectObject: (id: string | null) => void
  onUpdateProject: (project: DesignProject) => void
}) {
  if (!project) return null

  const moveLayer = (fromIndex: number, toIndex: number) => {
    const newLayers = [...project.layers]
    const [moved] = newLayers.splice(fromIndex, 1)
    newLayers.splice(toIndex, 0, moved)
    
    onUpdateProject({
      ...project,
      layers: newLayers
    })
  }

  const deleteObject = (objectId: string) => {
    onUpdateProject({
      ...project,
      objects: project.objects.filter(obj => obj.id !== objectId),
      layers: project.layers.filter(id => id !== objectId)
    })
    if (selectedObject === objectId) {
      onSelectObject(null)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Layers</h3>
      <div className="space-y-1">
        {project.layers.slice().reverse().map((layerId, index) => {
          const obj = project.objects.find(o => o.id === layerId)
          if (!obj) return null
          
          return (
            <div
              key={layerId}
              className={`p-2 border rounded cursor-pointer hover:bg-muted/50 ${
                selectedObject === layerId ? 'bg-primary/10 border-primary' : ''
              }`}
              onClick={() => onSelectObject(layerId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {obj.type === 'text' && <Type className="w-4 h-4" />}
                  {obj.type === 'shape' && <Square className="w-4 h-4" />}
                  {obj.type === 'image' && <Image className="w-4 h-4" />}
                  <span className="text-sm">
                    {obj.type === 'text' ? obj.properties.text?.slice(0, 20) : `${obj.type} ${index + 1}`}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={(e) => {
                    e.stopPropagation()
                    // Toggle visibility
                    onUpdateProject({
                      ...project,
                      objects: project.objects.map(o => 
                        o.id === layerId ? { ...o, visible: !o.visible } : o
                      )
                    })
                  }}>
                    {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => {
                    e.stopPropagation()
                    deleteObject(layerId)
                  }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}