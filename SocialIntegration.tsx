import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Facebook, Youtube, Instagram, Twitter, Globe, MessageCircle, Users, Share2, Settings, Link, Eye } from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface SocialConnection {
  id: string
  platform: 'facebook' | 'youtube' | 'instagram' | 'twitter' | 'custom'
  accountId: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  userId: string
  createdAt: string
}

interface CrossSiteFeature {
  id: string
  featureType: 'chat' | 'comments' | 'auth' | 'analytics' | 'social_feed'
  config: Record<string, any>
  enabledSites: string[]
  userId: string
  createdAt: string
}

export default function SocialIntegration() {
  const { user } = useAuth()
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [crossSiteFeatures, setCrossSiteFeatures] = useState<CrossSiteFeature[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadConnections()
      loadCrossSiteFeatures()
      loadDomains()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnections = async () => {
    try {
      const data = await blink.db.socialConnections.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setConnections(data)
    } catch (error) {
      console.error('Failed to load connections:', error)
    }
  }

  const loadCrossSiteFeatures = async () => {
    try {
      const data = await blink.db.crossSiteFeatures.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setCrossSiteFeatures(data.map(feature => ({
        ...feature,
        config: JSON.parse(feature.config || '{}'),
        enabledSites: JSON.parse(feature.enabledSites || '[]')
      })))
    } catch (error) {
      console.error('Failed to load cross-site features:', error)
    }
  }

  const loadDomains = async () => {
    try {
      const data = await blink.db.domains.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      setDomains(data)
    } catch (error) {
      console.error('Failed to load domains:', error)
    }
  }

  const connectPlatform = async (platform: SocialConnection['platform']) => {
    setIsConnecting(platform)
    
    try {
      // In a real implementation, this would redirect to OAuth flow
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const connection: Partial<SocialConnection> = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform,
        accountId: `${platform}_user_${Math.random().toString(36).substr(2, 6)}`,
        accessToken: 'mock_access_token',
        userId: user?.id || ''
      }

      await blink.db.socialConnections.create(connection)
      toast.success(`Connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`)
      loadConnections()
    } catch (error) {
      console.error('Connection failed:', error)
      toast.error(`Failed to connect to ${platform}`)
    } finally {
      setIsConnecting(null)
    }
  }

  const disconnectPlatform = async (connectionId: string) => {
    try {
      await blink.db.socialConnections.delete(connectionId)
      toast.success('Platform disconnected')
      loadConnections()
    } catch (error) {
      console.error('Disconnect failed:', error)
      toast.error('Failed to disconnect platform')
    }
  }

  const toggleCrossSiteFeature = async (featureType: CrossSiteFeature['featureType'], enabled: boolean) => {
    try {
      const existingFeature = crossSiteFeatures.find(f => f.featureType === featureType)
      
      if (existingFeature) {
        if (enabled) {
          // Enable for all domains
          await blink.db.crossSiteFeatures.update(existingFeature.id, {
            enabledSites: JSON.stringify(domains.map(d => d.domain))
          })
        } else {
          // Disable for all domains
          await blink.db.crossSiteFeatures.update(existingFeature.id, {
            enabledSites: JSON.stringify([])
          })
        }
      } else if (enabled) {
        // Create new feature
        const feature: Partial<CrossSiteFeature> = {
          id: `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          featureType,
          config: getDefaultConfig(featureType),
          enabledSites: domains.map(d => d.domain),
          userId: user?.id || ''
        }

        await blink.db.crossSiteFeatures.create({
          ...feature,
          config: JSON.stringify(feature.config),
          enabledSites: JSON.stringify(feature.enabledSites)
        })
      }

      toast.success(`${featureType} ${enabled ? 'enabled' : 'disabled'} across sites`)
      loadCrossSiteFeatures()
    } catch (error) {
      console.error('Failed to toggle feature:', error)
      toast.error('Failed to update feature')
    }
  }

  const getDefaultConfig = (featureType: CrossSiteFeature['featureType']) => {
    switch (featureType) {
      case 'chat':
        return {
          position: 'bottom-right',
          theme: 'light',
          welcomeMessage: 'Hello! How can I help you?'
        }
      case 'comments':
        return {
          moderation: true,
          allowAnonymous: false,
          requireApproval: false
        }
      case 'social_feed':
        return {
          platforms: ['twitter', 'instagram'],
          maxPosts: 10,
          refreshInterval: 300
        }
      case 'analytics':
        return {
          trackPageViews: true,
          trackEvents: true,
          anonymizeIPs: true
        }
      case 'auth':
        return {
          providers: ['google', 'facebook'],
          requireEmailVerification: true
        }
      default:
        return {}
    }
  }

  const generateEmbedCode = (featureType: CrossSiteFeature['featureType']) => {
    const baseUrl = 'https://llm-project-site-builder-dashboard-b2m28ujy.sites.blink.new'
    
    switch (featureType) {
      case 'chat':
        return `<script src="${baseUrl}/embed/chat.js" data-user-id="${user?.id}"></script>`
      case 'comments':
        return `<div id="blink-comments" data-user-id="${user?.id}"></div>\n<script src="${baseUrl}/embed/comments.js"></script>`
      case 'social_feed':
        return `<div id="blink-social-feed" data-user-id="${user?.id}"></div>\n<script src="${baseUrl}/embed/social-feed.js"></script>`
      default:
        return `<!-- ${featureType} embed code -->`
    }
  }

  const isFeatureEnabled = (featureType: CrossSiteFeature['featureType']) => {
    const feature = crossSiteFeatures.find(f => f.featureType === featureType)
    return feature && feature.enabledSites.length > 0
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-5 h-5" />
      case 'youtube': return <Youtube className="w-5 h-5" />
      case 'instagram': return <Instagram className="w-5 h-5" />
      case 'twitter': return <Twitter className="w-5 h-5" />
      default: return <Globe className="w-5 h-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-600'
      case 'youtube': return 'bg-red-600'
      case 'instagram': return 'bg-pink-600'
      case 'twitter': return 'bg-sky-500'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Integration</h1>
        <p className="text-muted-foreground">Connect platforms and enable cross-site features</p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platforms">Social Platforms</TabsTrigger>
          <TabsTrigger value="features">Cross-Site Features</TabsTrigger>
          <TabsTrigger value="embed">Embed Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Platforms */}
            <Card>
              <CardHeader>
                <CardTitle>Connect Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['facebook', 'youtube', 'instagram', 'twitter'].map((platform) => {
                  const isConnected = connections.some(c => c.platform === platform)
                  const isLoading = isConnecting === platform
                  
                  return (
                    <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg text-white ${getPlatformColor(platform)}`}>
                          {getPlatformIcon(platform)}
                        </div>
                        <div>
                          <h3 className="font-medium capitalize">{platform}</h3>
                          <p className="text-sm text-muted-foreground">
                            {isConnected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected && (
                          <Badge variant="secondary">Connected</Badge>
                        )}
                        <Button
                          size="sm"
                          variant={isConnected ? "destructive" : "default"}
                          onClick={() => {
                            if (isConnected) {
                              const connection = connections.find(c => c.platform === platform)
                              if (connection) disconnectPlatform(connection.id)
                            } else {
                              connectPlatform(platform as SocialConnection['platform'])
                            }
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {connections.length > 0 ? (
                  <div className="space-y-3">
                    {connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg text-white ${getPlatformColor(connection.platform)}`}>
                            {getPlatformIcon(connection.platform)}
                          </div>
                          <div>
                            <h3 className="font-medium capitalize">{connection.platform}</h3>
                            <p className="text-sm text-muted-foreground">{connection.accountId}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => disconnectPlatform(connection.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>No platforms connected yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chat Widget */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    <CardTitle>Chat Widget</CardTitle>
                  </div>
                  <Switch
                    checked={isFeatureEnabled('chat')}
                    onCheckedChange={(checked) => toggleCrossSiteFeature('chat', checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a chat widget to all your sites for customer support
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <Select defaultValue="bottom-right">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Welcome Message</label>
                    <Input placeholder="Hello! How can I help you?" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments System */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    <CardTitle>Comments System</CardTitle>
                  </div>
                  <Switch
                    checked={isFeatureEnabled('comments')}
                    onCheckedChange={(checked) => toggleCrossSiteFeature('comments', checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Universal commenting system across all your sites
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Require Moderation</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow Anonymous</label>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Feed */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5" />
                    <CardTitle>Social Feed</CardTitle>
                  </div>
                  <Switch
                    checked={isFeatureEnabled('social_feed')}
                    onCheckedChange={(checked) => toggleCrossSiteFeature('social_feed', checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Display your social media posts across all sites
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Max Posts</label>
                    <Input type="number" defaultValue="10" min="1" max="50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Refresh Interval (seconds)</label>
                    <Input type="number" defaultValue="300" min="60" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5" />
                    <CardTitle>Universal Analytics</CardTitle>
                  </div>
                  <Switch
                    checked={isFeatureEnabled('analytics')}
                    onCheckedChange={(checked) => toggleCrossSiteFeature('analytics', checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Track visitors and events across all your sites
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Track Page Views</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Track Events</label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Anonymize IPs</label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="embed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Embed Codes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Copy these codes to manually embed features on external sites
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {['chat', 'comments', 'social_feed'].map((featureType) => (
                <div key={featureType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize">{featureType.replace('_', ' ')}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generateEmbedCode(featureType as CrossSiteFeature['featureType']))
                        toast.success('Embed code copied!')
                      }}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Copy Code
                    </Button>
                  </div>
                  <Textarea
                    value={generateEmbedCode(featureType as CrossSiteFeature['featureType'])}
                    readOnly
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}