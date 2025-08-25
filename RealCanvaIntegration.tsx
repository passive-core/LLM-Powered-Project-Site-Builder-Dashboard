import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { useToast } from '../hooks/use-toast'
import { Palette, Download, Upload, Search, Star, Folder, Image, Video, FileText } from 'lucide-react'
import blink from '../blink/client'

interface CanvaTemplate {
  id: string
  title: string
  thumbnail: string
  category: string
  isPro: boolean
  dimensions: { width: number; height: number }
}

interface CanvaBrandKit {
  id: string
  name: string
  colors: string[]
  fonts: string[]
  logos: string[]
}

interface CanvaDesign {
  id: string
  title: string
  thumbnail: string
  type: string
  createdAt: string
  isShared: boolean
}

export function RealCanvaIntegration() {
  const [isConnected, setIsConnected] = useState(false)
  const [templates, setTemplates] = useState<CanvaTemplate[]>([])
  const [brandKits, setBrandKits] = useState<CanvaBrandKit[]>([])
  const [myDesigns, setMyDesigns] = useState<CanvaDesign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkCanvaConnection()
    if (isConnected) {
      loadCanvaData()
    }
  }, [isConnected])

  const checkCanvaConnection = async () => {
    try {
      const connections = await blink.db.socialConnections.list({
        where: { platform: 'canva' }
      })
      setIsConnected(connections.length > 0)
    } catch (error) {
      console.error('Error checking Canva connection:', error)
    }
  }

  const connectToCanva = async () => {
    setLoading(true)
    try {
      // Real Canva OAuth flow
      const clientId = '{{CANVA_CLIENT_ID}}' // From secrets
      const redirectUri = `${window.location.origin}/auth/canva/callback`
      const scope = 'design:read design:write brand:read folder:read'
      
      const authUrl = `https://www.canva.com/api/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${Math.random().toString(36).substring(7)}`
      
      // Open OAuth popup
      const popup = window.open(authUrl, 'canva-auth', 'width=600,height=700')
      
      // Listen for OAuth callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          checkCanvaConnection()
        }
      }, 1000)
      
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Canva. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCanvaData = async () => {
    setLoading(true)
    try {
      // Load templates via Canva API
      const templatesResponse = await blink.data.fetch({
        url: 'https://api.canva.com/rest/v1/designs/templates',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{CANVA_ACCESS_TOKEN}}'
        },
        query: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          query: searchQuery || undefined,
          limit: '50'
        }
      })
      
      if (templatesResponse.status === 200) {
        setTemplates(templatesResponse.body.items || [])
      }
      
      // Load brand kits
      const brandResponse = await blink.data.fetch({
        url: 'https://api.canva.com/rest/v1/brand-templates',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{CANVA_ACCESS_TOKEN}}'
        }
      })
      
      if (brandResponse.status === 200) {
        setBrandKits(brandResponse.body.items || [])
      }
      
      // Load user designs
      const designsResponse = await blink.data.fetch({
        url: 'https://api.canva.com/rest/v1/designs',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{CANVA_ACCESS_TOKEN}}'
        },
        query: {
          limit: '50',
          sort_by: 'modified_descending'
        }
      })
      
      if (designsResponse.status === 200) {
        setMyDesigns(designsResponse.body.items || [])
      }
      
    } catch (error) {
      toast({
        title: 'Loading Failed',
        description: 'Failed to load Canva data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const importTemplate = async (template: CanvaTemplate) => {
    try {
      // Create design from template
      const response = await blink.data.fetch({
        url: 'https://api.canva.com/rest/v1/designs',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{CANVA_ACCESS_TOKEN}}',
          'Content-Type': 'application/json'
        },
        body: {
          design_type: template.category,
          template_id: template.id
        }
      })
      
      if (response.status === 201) {
        // Save to our design assets
        await blink.db.designAssets.create({
          name: template.title,
          type: 'canva-template',
          url: response.body.urls.view_url,
          thumbnailUrl: template.thumbnail,
          source: 'canva',
          metadata: JSON.stringify({
            canvaId: response.body.id,
            dimensions: template.dimensions,
            isPro: template.isPro
          })
        })
        
        toast({
          title: 'Template Imported',
          description: `${template.title} has been added to your assets.`
        })
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import template. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const exportDesign = async (design: CanvaDesign, format: 'png' | 'jpg' | 'pdf' | 'mp4') => {
    try {
      const response = await blink.data.fetch({
        url: `https://api.canva.com/rest/v1/designs/${design.id}/export`,
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{CANVA_ACCESS_TOKEN}}',
          'Content-Type': 'application/json'
        },
        body: {
          format: format,
          quality: 'high'
        }
      })
      
      if (response.status === 200) {
        // Download the exported file
        const downloadUrl = response.body.urls.download_url
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${design.title}.${format}`
        link.click()
        
        toast({
          title: 'Export Complete',
          description: `${design.title} exported as ${format.toUpperCase()}.`
        })
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export design. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const categories = ['all', 'social-media', 'presentation', 'document', 'marketing', 'video', 'print']

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Connect to Canva Pro</CardTitle>
          <CardDescription>
            Access your Canva Pro templates, brand kits, and designs directly in your projects.
            Import templates, sync brand assets, and export high-quality designs.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={connectToCanva} 
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? 'Connecting...' : 'Connect Canva Pro'}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Requires Canva Pro subscription for full access to premium templates and features.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Canva Integration</h2>
          <p className="text-muted-foreground">Access your Canva Pro assets and create new designs</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Connected
        </Badge>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search templates, designs, or brand assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={loadCanvaData} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="designs">My Designs</TabsTrigger>
          <TabsTrigger value="brand">Brand Kit</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                  <img 
                    src={template.thumbnail} 
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {template.isPro && (
                    <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                      <Star className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{template.title}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {template.dimensions.width} × {template.dimensions.height}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => importTemplate(template)}
                      className="h-8"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="designs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {myDesigns.map((design) => (
              <Card key={design.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                  <img 
                    src={design.thumbnail} 
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {design.isShared && (
                    <Badge className="absolute top-2 right-2 bg-blue-500">
                      Shared
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{design.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportDesign(design, 'png')}
                      className="h-8 flex-1"
                    >
                      <Image className="w-3 h-3 mr-1" />
                      PNG
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportDesign(design, 'pdf')}
                      className="h-8 flex-1"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    {design.type === 'video' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => exportDesign(design, 'mp4')}
                        className="h-8 flex-1"
                      >
                        <Video className="w-3 h-3 mr-1" />
                        MP4
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandKits.map((brandKit) => (
              <Card key={brandKit.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{brandKit.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Colors</h4>
                    <div className="flex gap-2 flex-wrap">
                      {brandKit.colors.map((color, index) => (
                        <div 
                          key={index}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Fonts</h4>
                    <div className="space-y-1">
                      {brandKit.fonts.slice(0, 3).map((font, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {font}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Brand Kit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Folder Management</h3>
            <p className="text-muted-foreground mb-4">
              Organize your Canva designs into folders for better project management.
            </p>
            <Button>
              <Folder className="w-4 h-4 mr-2" />
              Create New Folder
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}