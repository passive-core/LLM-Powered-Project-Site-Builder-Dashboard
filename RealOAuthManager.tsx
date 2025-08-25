import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { useToast } from '../hooks/use-toast'
import { 
  Youtube, Facebook, Instagram, Twitter, Linkedin, 
  TrendingUp, Users, Eye, Heart, MessageCircle, Share2,
  Calendar, Clock, Globe, Settings, Plus, ExternalLink
} from 'lucide-react'
import blink from '../blink/client'

interface SocialConnection {
  id: string
  platform: string
  accountId: string
  accountName: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  isActive: boolean
  permissions: string[]
  profileImage?: string
  followerCount?: number
}

interface SocialPost {
  id: string
  platform: string
  content: string
  mediaUrls: string[]
  scheduledFor?: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  engagement?: {
    likes: number
    comments: number
    shares: number
    views: number
  }
  publishedAt?: string
}

interface PlatformConfig {
  name: string
  icon: React.ComponentType<any>
  color: string
  authUrl: string
  scopes: string[]
  features: string[]
}

const platformConfigs: Record<string, PlatformConfig> = {
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-500',
    authUrl: 'https://accounts.google.com/oauth2/auth',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    features: ['Video Upload', 'Analytics', 'Channel Management', 'Live Streaming']
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'publish_to_groups'],
    features: ['Page Posting', 'Group Publishing', 'Analytics', 'Ad Management']
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scopes: ['user_profile', 'user_media', 'instagram_basic', 'instagram_content_publish'],
    features: ['Photo/Video Posting', 'Stories', 'Reels', 'Analytics']
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    features: ['Tweet Posting', 'Thread Creation', 'Analytics', 'DM Management']
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_organization_social'],
    features: ['Profile Posting', 'Company Pages', 'Analytics', 'Lead Generation']
  }
}

export function RealOAuthManager() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [newPost, setNewPost] = useState({ content: '', mediaUrls: [], scheduledFor: '' })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConnections()
    loadPosts()
  }, [])

  const loadConnections = async () => {
    try {
      const socialConnections = await blink.db.socialConnections.list()
      
      // Enrich with platform data and verify tokens
      const enrichedConnections = await Promise.all(
        socialConnections.map(async (conn) => {
          const isActive = await verifyToken(conn.platform, conn.accessToken)
          const profileData = await getProfileData(conn.platform, conn.accessToken)
          
          return {
            id: conn.id,
            platform: conn.platform,
            accountId: conn.accountId,
            accountName: profileData?.name || conn.accountId,
            accessToken: conn.accessToken,
            refreshToken: conn.refreshToken,
            expiresAt: conn.expiresAt,
            isActive,
            permissions: platformConfigs[conn.platform]?.scopes || [],
            profileImage: profileData?.profileImage,
            followerCount: profileData?.followerCount
          }
        })
      )
      
      setConnections(enrichedConnections)
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  const loadPosts = async () => {
    try {
      // Load from our media projects table
      const mediaProjects = await blink.db.mediaProjects.list({
        where: { type: 'social-post' }
      })
      
      const socialPosts = mediaProjects.map(project => ({
        id: project.id,
        platform: JSON.parse(project.content || '{}').platform || 'unknown',
        content: JSON.parse(project.content || '{}').text || '',
        mediaUrls: JSON.parse(project.assets || '[]'),
        scheduledFor: JSON.parse(project.content || '{}').scheduledFor,
        status: project.status as 'draft' | 'scheduled' | 'published' | 'failed',
        engagement: JSON.parse(project.content || '{}').engagement,
        publishedAt: JSON.parse(project.content || '{}').publishedAt
      }))
      
      setPosts(socialPosts)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const verifyToken = async (platform: string, token: string): Promise<boolean> => {
    try {
      const response = await blink.data.fetch({
        url: `/api/social/verify/${platform}`,
        method: 'POST',
        body: { accessToken: token }
      })
      return response.status === 200
    } catch {
      return false
    }
  }

  const getProfileData = async (platform: string, token: string) => {
    try {
      const response = await blink.data.fetch({
        url: `/api/social/profile/${platform}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.status === 200 ? response.body : null
    } catch {
      return null
    }
  }

  const connectPlatform = async (platform: string) => {
    setLoading(true)
    try {
      const config = platformConfigs[platform]
      if (!config) throw new Error('Platform not supported')
      
      // Generate OAuth URL with proper parameters
      const clientId = `{{${platform.toUpperCase()}_CLIENT_ID}}`
      const redirectUri = `${window.location.origin}/auth/${platform}/callback`
      const state = Math.random().toString(36).substring(7)
      const scopes = config.scopes.join(' ')
      
      let authUrl = `${config.authUrl}?`
      
      if (platform === 'youtube') {
        authUrl += `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&state=${state}`
      } else if (platform === 'facebook') {
        authUrl += `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`
      } else if (platform === 'instagram') {
        authUrl += `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`
      } else if (platform === 'twitter') {
        authUrl += `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`
      } else if (platform === 'linkedin') {
        authUrl += `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`
      }
      
      // Open OAuth popup
      const popup = window.open(authUrl, `${platform}-auth`, 'width=600,height=700')
      
      // Listen for OAuth callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          loadConnections() // Refresh connections
        }
      }, 1000)
      
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to ${platformConfigs[platform]?.name}. Please try again.`,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const disconnectPlatform = async (connectionId: string) => {
    try {
      await blink.db.socialConnections.delete(connectionId)
      await loadConnections()
      
      toast({
        title: 'Disconnected',
        description: 'Platform has been disconnected successfully.'
      })
    } catch (error) {
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect platform. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const publishPost = async (platforms: string[]) => {
    if (!newPost.content.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter content for your post.',
        variant: 'destructive'
      })
      return
    }
    
    setLoading(true)
    try {
      for (const platform of platforms) {
        const connection = connections.find(c => c.platform === platform && c.isActive)
        if (!connection) continue
        
        // Create post via platform API
        const response = await blink.data.fetch({
          url: `/api/social/post/${platform}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.accessToken}`
          },
          body: {
            content: newPost.content,
            mediaUrls: newPost.mediaUrls,
            scheduledFor: newPost.scheduledFor || undefined
          }
        })
        
        if (response.status === 200) {
          // Save to our database
          await blink.db.mediaProjects.create({
            title: `${platform} Post`,
            type: 'social-post',
            content: JSON.stringify({
              platform,
              text: newPost.content,
              scheduledFor: newPost.scheduledFor,
              publishedAt: new Date().toISOString(),
              postId: response.body.id
            }),
            assets: JSON.stringify(newPost.mediaUrls),
            status: newPost.scheduledFor ? 'scheduled' : 'published'
          })
        }
      }
      
      // Reset form
      setNewPost({ content: '', mediaUrls: [], scheduledFor: '' })
      await loadPosts()
      
      toast({
        title: 'Post Published',
        description: `Successfully published to ${platforms.length} platform(s).`
      })
    } catch (error) {
      toast({
        title: 'Publishing Failed',
        description: 'Failed to publish post. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getAnalytics = async (platform: string, postId: string) => {
    try {
      const connection = connections.find(c => c.platform === platform)
      if (!connection) return null
      
      const response = await blink.data.fetch({
        url: `/api/social/analytics/${platform}/${postId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`
        }
      })
      
      return response.status === 200 ? response.body : null
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Social Media Manager</h2>
          <p className="text-muted-foreground">Connect platforms, publish content, and track performance</p>
        </div>
        <Badge variant="secondary">
          {connections.filter(c => c.isActive).length} Connected
        </Badge>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(platformConfigs).map(([key, config]) => {
              const connection = connections.find(c => c.platform === key)
              const Icon = config.icon
              
              return (
                <Card key={key} className="relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-5 ${config.color}`} />
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        <CardDescription>
                          {connection ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={connection.isActive ? 'default' : 'destructive'}>
                                {connection.isActive ? 'Connected' : 'Expired'}
                              </Badge>
                              {connection.followerCount && (
                                <span className="text-xs">
                                  {connection.followerCount.toLocaleString()} followers
                                </span>
                              )}
                            </div>
                          ) : (
                            'Not connected'
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Features:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {config.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {connection ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => disconnectPlatform(connection.id)}
                        >
                          Disconnect
                        </Button>
                        {!connection.isActive && (
                          <Button 
                            size="sm"
                            onClick={() => connectPlatform(key)}
                            disabled={loading}
                          >
                            Reconnect
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => connectPlatform(key)}
                        disabled={loading}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Connect {config.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>
                Publish content across multiple social media platforms simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-32"
                />
                <div className="text-xs text-muted-foreground">
                  {newPost.content.length}/280 characters
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule (Optional)</label>
                <Input
                  type="datetime-local"
                  value={newPost.scheduledFor}
                  onChange={(e) => setNewPost(prev => ({ ...prev, scheduledFor: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {connections.filter(c => c.isActive).map((connection) => {
                    const config = platformConfigs[connection.platform]
                    const Icon = config?.icon
                    
                    return (
                      <Button
                        key={connection.id}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          if (selectedPlatform === connection.platform) {
                            setSelectedPlatform(null)
                          } else {
                            setSelectedPlatform(connection.platform)
                          }
                        }}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {config?.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => publishPost(selectedPlatform ? [selectedPlatform] : connections.filter(c => c.isActive).map(c => c.platform))}
                disabled={loading || !newPost.content.trim()}
              >
                {loading ? 'Publishing...' : newPost.scheduledFor ? 'Schedule Post' : 'Publish Now'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const config = platformConfigs[post.platform]
              const Icon = config?.icon
              
              return (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {Icon && (
                        <div className={`p-1 rounded ${config.color} text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-sm">{config?.name} Post</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant={post.status === 'published' ? 'default' : 
                                        post.status === 'failed' ? 'destructive' : 'secondary'}>
                            {post.status}
                          </Badge>
                          {post.publishedAt && (
                            <span className="text-xs">
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    
                    {post.engagement && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.engagement.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.engagement.comments}
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {post.engagement.shares}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.engagement.views}
                        </div>
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      View Post
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2M</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8%</div>
                <p className="text-xs text-muted-foreground">+0.3% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{posts.filter(p => p.status === 'published').length}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Best Performing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">YouTube</div>
                <p className="text-xs text-muted-foreground">Highest engagement</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.filter(c => c.isActive).map((connection) => {
                  const config = platformConfigs[connection.platform]
                  const Icon = config?.icon
                  
                  return (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <div className={`p-2 rounded ${config.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{config?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {connection.followerCount?.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">85%</div>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}