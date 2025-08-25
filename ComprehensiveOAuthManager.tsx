import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Plus, Settings, Trash2, RefreshCw, ExternalLink, Copy, Eye, EyeOff,
  CheckCircle, AlertTriangle, Clock, Users, Globe, Mail, MessageSquare,
  Image, Video, Calendar, FileText, BarChart3, Zap, Shield, Key,
  Twitter, Facebook, Youtube, Instagram, Linkedin, Github, Twitch,
  Palette, Camera, Music, Briefcase, Code, Gamepad2, Heart
} from 'lucide-react'
import blink from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface OAuthProvider {
  id: string
  name: string
  displayName: string
  icon: React.ComponentType<any>
  color: string
  description: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
  requiredFields: string[]
  optionalFields: string[]
  capabilities: string[]
  rateLimit: {
    requests: number
    window: string
  }
  webhookSupport: boolean
  status: 'active' | 'beta' | 'deprecated'
}

interface ConnectedAccount {
  id: string
  providerId: string
  providerName: string
  accountId: string
  username: string
  displayName: string
  email?: string
  avatar?: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  scopes: string[]
  permissions: string[]
  metadata: Record<string, any>
  status: 'active' | 'expired' | 'revoked' | 'error'
  lastSync: string
  createdAt: string
  updatedAt: string
  userId: string
  stats: {
    apiCalls: number
    lastActivity: string
    dataSync: boolean
    webhooksActive: number
  }
}

interface OAuthProfile {
  id: string
  accountId: string
  providerId: string
  profile: {
    id: string
    username: string
    displayName: string
    firstName?: string
    lastName?: string
    email?: string
    avatar?: string
    bio?: string
    location?: string
    website?: string
    verified: boolean
    followers?: number
    following?: number
    posts?: number
    createdAt?: string
  }
  capabilities: {
    canPost: boolean
    canRead: boolean
    canDelete: boolean
    canManage: boolean
    canAnalyze: boolean
  }
  limits: {
    dailyPosts?: number
    monthlyPosts?: number
    apiCalls?: number
    dataExport?: boolean
  }
  lastUpdated: string
}

const oauthProviders: OAuthProvider[] = [
  {
    id: 'canva',
    name: 'canva',
    displayName: 'Canva',
    icon: Palette,
    color: 'bg-purple-500',
    description: 'Design platform for creating graphics, presentations, and marketing materials',
    scopes: ['design:read', 'design:write', 'folder:read', 'folder:write', 'user:read'],
    authUrl: 'https://www.canva.com/api/oauth/authorize',
    tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
    userInfoUrl: 'https://api.canva.com/rest/v1/users/me',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['webhook_url'],
    capabilities: ['Create designs', 'Manage folders', 'Export designs', 'Team collaboration'],
    rateLimit: { requests: 100, window: '1 hour' },
    webhookSupport: true,
    status: 'active'
  },
  {
    id: 'google',
    name: 'google',
    displayName: 'Google',
    icon: Globe,
    color: 'bg-blue-500',
    description: 'Google services including Drive, Gmail, Calendar, and Analytics',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar'
    ],
    authUrl: 'https://accounts.google.com/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['service_account_key'],
    capabilities: ['File management', 'Email access', 'Calendar sync', 'Analytics data'],
    rateLimit: { requests: 1000, window: '1 day' },
    webhookSupport: true,
    status: 'active'
  },
  {
    id: 'twitter',
    name: 'twitter',
    displayName: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    description: 'Social media platform for posting tweets and engaging with followers',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'follows.write'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['bearer_token'],
    capabilities: ['Post tweets', 'Read timeline', 'Manage followers', 'Analytics'],
    rateLimit: { requests: 300, window: '15 minutes' },
    webhookSupport: true,
    status: 'active'
  },
  {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube',
    icon: Youtube,
    color: 'bg-red-500',
    description: 'Video platform for uploading, managing, and analyzing video content',
    scopes: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtubepartner'
    ],
    authUrl: 'https://accounts.google.com/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['api_key'],
    capabilities: ['Upload videos', 'Manage playlists', 'Analytics', 'Live streaming'],
    rateLimit: { requests: 10000, window: '1 day' },
    webhookSupport: true,
    status: 'active'
  },
  {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Social media platform for posting content and managing pages',
    scopes: ['public_profile', 'email', 'pages_manage_posts', 'pages_read_engagement'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me',
    requiredFields: ['app_id', 'app_secret', 'redirect_uri'],
    optionalFields: ['page_access_token'],
    capabilities: ['Post to pages', 'Read insights', 'Manage ads', 'Messenger integration'],
    rateLimit: { requests: 200, window: '1 hour' },
    webhookSupport: true,
    status: 'active'
  },
  {
    id: 'instagram',
    name: 'instagram',
    displayName: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Photo and video sharing platform with business features',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoUrl: 'https://graph.instagram.com/me',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['business_account_id'],
    capabilities: ['Post photos/videos', 'Stories', 'Reels', 'Analytics'],
    rateLimit: { requests: 240, window: '1 hour' },
    webhookSupport: true,
    status: 'active'
  },
  {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Professional networking platform for business content',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_organization_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/people/~',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['company_page_id'],
    capabilities: ['Post updates', 'Company pages', 'Analytics', 'Lead generation'],
    rateLimit: { requests: 500, window: '1 day' },
    webhookSupport: false,
    status: 'active'
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    icon: Github,
    color: 'bg-gray-800',
    description: 'Code repository platform for development and collaboration',
    scopes: ['user', 'repo', 'workflow', 'read:org'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    requiredFields: ['client_id', 'client_secret', 'redirect_uri'],
    optionalFields: ['webhook_secret'],
    capabilities: ['Repository management', 'Actions', 'Issues', 'Pull requests'],
    rateLimit: { requests: 5000, window: '1 hour' },
    webhookSupport: true,
    status: 'active'
  }
]

export default function ComprehensiveOAuthManager() {
  const { user } = useAuth()
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [profiles, setProfiles] = useState<OAuthProfile[]>([])
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState('providers')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadConnectedAccounts()
      loadProfiles()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnectedAccounts = async () => {
    try {
      // In production, load from social_connections table
      const accounts = await blink.db.socialConnections.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Transform to ConnectedAccount format
      const transformedAccounts: ConnectedAccount[] = accounts.map(account => ({
        id: account.id,
        providerId: account.platform,
        providerName: account.platform,
        accountId: account.accountId,
        username: account.accountId,
        displayName: account.accountId,
        accessToken: account.accessToken || '',
        refreshToken: account.refreshToken,
        expiresAt: account.expiresAt,
        scopes: [],
        permissions: [],
        metadata: {},
        status: 'active',
        lastSync: account.createdAt,
        createdAt: account.createdAt,
        updatedAt: account.createdAt,
        userId: account.userId,
        stats: {
          apiCalls: 0,
          lastActivity: account.createdAt,
          dataSync: true,
          webhooksActive: 0
        }
      }))
      
      setConnectedAccounts(transformedAccounts)
    } catch (error) {
      console.error('Failed to load connected accounts:', error)
    }
  }

  const loadProfiles = async () => {
    try {
      // Mock profiles for demonstration
      const mockProfiles: OAuthProfile[] = []
      setProfiles(mockProfiles)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const initiateOAuthFlow = async (provider: OAuthProvider) => {
    setIsConnecting(provider.id)
    
    try {
      // Check if secrets are configured
      const requiredSecrets = provider.requiredFields.map(field => 
        `${provider.name.toUpperCase()}_${field.toUpperCase()}`
      )
      
      // In a real implementation, check if secrets exist
      // For now, simulate the OAuth flow
      
      toast.success(`Initiating ${provider.displayName} connection...`)
      
      // Simulate OAuth redirect
      const authUrl = `${provider.authUrl}?client_id={{${provider.name}_client_id}}&redirect_uri={{${provider.name}_redirect_uri}}&scope=${provider.scopes.join(' ')}&response_type=code&state=${Math.random().toString(36)}`
      
      // In production, redirect to OAuth provider
      console.log('OAuth URL:', authUrl)
      
      // Simulate successful connection after delay
      setTimeout(() => {
        const newAccount: ConnectedAccount = {
          id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          providerId: provider.id,
          providerName: provider.displayName,
          accountId: `user_${Math.random().toString(36).substr(2, 8)}`,
          username: `user_${Math.random().toString(36).substr(2, 8)}`,
          displayName: `${provider.displayName} User`,
          email: `user@${provider.name}.com`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.id}`,
          accessToken: `access_token_${Math.random().toString(36)}`,
          refreshToken: `refresh_token_${Math.random().toString(36)}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          scopes: provider.scopes,
          permissions: provider.capabilities,
          metadata: {
            provider: provider.displayName,
            connectedAt: new Date().toISOString()
          },
          status: 'active',
          lastSync: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user?.id || '',
          stats: {
            apiCalls: 0,
            lastActivity: new Date().toISOString(),
            dataSync: true,
            webhooksActive: 0
          }
        }
        
        setConnectedAccounts(prev => [newAccount, ...prev])
        
        // Create profile
        const newProfile: OAuthProfile = {
          id: `profile_${newAccount.id}`,
          accountId: newAccount.id,
          providerId: provider.id,
          profile: {
            id: newAccount.accountId,
            username: newAccount.username,
            displayName: newAccount.displayName,
            email: newAccount.email,
            avatar: newAccount.avatar,
            verified: Math.random() > 0.5,
            followers: Math.floor(Math.random() * 10000),
            following: Math.floor(Math.random() * 1000),
            posts: Math.floor(Math.random() * 500)
          },
          capabilities: {
            canPost: true,
            canRead: true,
            canDelete: true,
            canManage: true,
            canAnalyze: true
          },
          limits: {
            dailyPosts: 100,
            monthlyPosts: 3000,
            apiCalls: 10000,
            dataExport: true
          },
          lastUpdated: new Date().toISOString()
        }
        
        setProfiles(prev => [newProfile, ...prev])
        
        toast.success(`Successfully connected to ${provider.displayName}!`)
        setIsConnecting(null)
      }, 2000)
      
    } catch (error) {
      console.error('OAuth flow failed:', error)
      toast.error(`Failed to connect to ${provider.displayName}`)
      setIsConnecting(null)
    }
  }

  const disconnectAccount = async (accountId: string) => {
    try {
      setConnectedAccounts(prev => prev.filter(account => account.id !== accountId))
      setProfiles(prev => prev.filter(profile => profile.accountId !== accountId))
      toast.success('Account disconnected successfully')
    } catch (error) {
      console.error('Failed to disconnect account:', error)
      toast.error('Failed to disconnect account')
    }
  }

  const refreshToken = async (accountId: string) => {
    try {
      const account = connectedAccounts.find(a => a.id === accountId)
      if (!account) return
      
      // Simulate token refresh
      setConnectedAccounts(prev => prev.map(a => 
        a.id === accountId 
          ? {
              ...a,
              accessToken: `refreshed_token_${Math.random().toString(36)}`,
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              updatedAt: new Date().toISOString()
            }
          : a
      ))
      
      toast.success('Token refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh token:', error)
      toast.error('Failed to refresh token')
    }
  }

  const syncProfile = async (accountId: string) => {
    try {
      const account = connectedAccounts.find(a => a.id === accountId)
      if (!account) return
      
      // Simulate profile sync
      setProfiles(prev => prev.map(profile => 
        profile.accountId === accountId
          ? {
              ...profile,
              profile: {
                ...profile.profile,
                followers: profile.profile.followers! + Math.floor(Math.random() * 100),
                posts: profile.profile.posts! + Math.floor(Math.random() * 10)
              },
              lastUpdated: new Date().toISOString()
            }
          : profile
      ))
      
      setConnectedAccounts(prev => prev.map(a => 
        a.id === accountId
          ? { ...a, lastSync: new Date().toISOString() }
          : a
      ))
      
      toast.success('Profile synced successfully')
    } catch (error) {
      console.error('Failed to sync profile:', error)
      toast.error('Failed to sync profile')
    }
  }

  const toggleSecretVisibility = (providerId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const getProviderIcon = (providerId: string) => {
    const provider = oauthProviders.find(p => p.id === providerId)
    return provider?.icon || Globe
  }

  const getProviderColor = (providerId: string) => {
    const provider = oauthProviders.find(p => p.id === providerId)
    return provider?.color || 'bg-gray-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'expired': return 'text-yellow-500'
      case 'revoked': case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'expired': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'revoked': case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredProviders = oauthProviders.filter(provider => 
    provider.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAccounts = connectedAccounts.filter(account => {
    const matchesSearch = account.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || account.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            OAuth Manager
          </h1>
          <p className="text-muted-foreground">Connect and manage social media and service accounts</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {connectedAccounts.length} Connected
          </Badge>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border-b p-4 flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search providers or accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="providers">Providers ({oauthProviders.length})</TabsTrigger>
              <TabsTrigger value="accounts">Connected ({connectedAccounts.length})</TabsTrigger>
              <TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="providers" className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map((provider) => {
                  const Icon = provider.icon
                  const isConnected = connectedAccounts.some(account => account.providerId === provider.id)
                  const isCurrentlyConnecting = isConnecting === provider.id
                  
                  return (
                    <Card key={provider.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded text-white ${provider.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                              <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                                {provider.status}
                              </Badge>
                            </div>
                          </div>
                          {isConnected && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Capabilities</h4>
                          <div className="flex flex-wrap gap-1">
                            {provider.capabilities.slice(0, 3).map((capability, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {capability}
                              </Badge>
                            ))}
                            {provider.capabilities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{provider.capabilities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Rate: {provider.rateLimit.requests}/{provider.rateLimit.window}</span>
                          <span>Webhooks: {provider.webhookSupport ? '✓' : '✗'}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            onClick={() => initiateOAuthFlow(provider)}
                            disabled={isCurrentlyConnecting}
                          >
                            {isCurrentlyConnecting ? (
                              <>
                                <Clock className="w-3 h-3 mr-1 animate-pulse" />
                                Connecting...
                              </>
                            ) : isConnected ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Reconnect
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Connect
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedProvider(provider)}>
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="p-4 space-y-4">
              {filteredAccounts.length > 0 ? (
                <div className="space-y-3">
                  {filteredAccounts.map((account) => {
                    const Icon = getProviderIcon(account.providerId)
                    const profile = profiles.find(p => p.accountId === account.id)
                    
                    return (
                      <Card key={account.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={account.avatar} />
                                <AvatarFallback>
                                  <Icon className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{account.displayName}</h3>
                                <p className="text-sm text-muted-foreground">@{account.username}</p>
                                <p className="text-xs text-muted-foreground">{account.providerName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusIcon(account.status)}
                              <Button size="sm" variant="outline" onClick={() => setSelectedAccount(account)}>
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {profile && (
                            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-medium">{profile.profile.followers?.toLocaleString() || 0}</p>
                                <p className="text-muted-foreground">Followers</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{profile.profile.following?.toLocaleString() || 0}</p>
                                <p className="text-muted-foreground">Following</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{profile.profile.posts?.toLocaleString() || 0}</p>
                                <p className="text-muted-foreground">Posts</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              <p>Last sync: {new Date(account.lastSync).toLocaleString()}</p>
                              <p>API calls: {account.stats.apiCalls}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => syncProfile(account.id)}>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Sync
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => refreshToken(account.id)}>
                                <Key className="w-3 h-3 mr-1" />
                                Refresh
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => disconnectAccount(account.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Connected Accounts</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect to social media and service providers to get started
                  </p>
                  <Button onClick={() => setActiveTab('providers')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Account
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="profiles" className="p-4 space-y-4">
              {profiles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {profiles.map((profile) => {
                    const Icon = getProviderIcon(profile.providerId)
                    
                    return (
                      <Card key={profile.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={profile.profile.avatar} />
                              <AvatarFallback>
                                <Icon className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{profile.profile.displayName}</h3>
                              <p className="text-sm text-muted-foreground">@{profile.profile.username}</p>
                              {profile.profile.verified && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {profile.profile.bio && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {profile.profile.bio}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                            <div className="text-center">
                              <p className="font-medium">{profile.profile.followers?.toLocaleString() || 0}</p>
                              <p className="text-muted-foreground">Followers</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{profile.profile.following?.toLocaleString() || 0}</p>
                              <p className="text-muted-foreground">Following</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{profile.profile.posts?.toLocaleString() || 0}</p>
                              <p className="text-muted-foreground">Posts</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Capabilities</h4>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(profile.capabilities).map(([key, value]) => (
                                <Badge key={key} variant={value ? 'default' : 'secondary'} className="text-xs">
                                  {key.replace('can', '').toLowerCase()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4 text-xs text-muted-foreground">
                            <p>Updated: {new Date(profile.lastUpdated).toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Profiles Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect accounts to view and manage profiles
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="p-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>OAuth Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Configure OAuth secrets for each provider. These are stored securely and never exposed to the frontend.
                  </div>
                  
                  {oauthProviders.map((provider) => (
                    <div key={provider.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded text-white ${provider.color}`}>
                          {React.createElement(provider.icon, { className: 'w-4 h-4' })}
                        </div>
                        <h3 className="font-medium">{provider.displayName}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {provider.requiredFields.map((field) => {
                          const secretKey = `${provider.name.toUpperCase()}_${field.toUpperCase()}`
                          const isVisible = showSecrets[`${provider.id}_${field}`]
                          
                          return (
                            <div key={field}>
                              <label className="text-sm font-medium mb-1 block capitalize">
                                {field.replace('_', ' ')}
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  type={isVisible ? 'text' : 'password'}
                                  placeholder={`Enter ${field}`}
                                  value={isVisible ? `{{${secretKey}}}` : '••••••••••••'}
                                  readOnly
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleSecretVisibility(`${provider.id}_${field}`)}
                                >
                                  {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                        
                        {provider.optionalFields.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-2">Optional Fields</p>
                            {provider.optionalFields.map((field) => {
                              const secretKey = `${provider.name.toUpperCase()}_${field.toUpperCase()}`
                              
                              return (
                                <div key={field} className="mb-2">
                                  <label className="text-sm text-muted-foreground mb-1 block capitalize">
                                    {field.replace('_', ' ')}
                                  </label>
                                  <Input
                                    placeholder={`Optional: ${field}`}
                                    value={`{{${secretKey}}}`}
                                    readOnly
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(selectedProvider.icon, { className: 'w-5 h-5' })}
                {selectedProvider.displayName} Configuration
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedProvider.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">OAuth Scopes</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedProvider.scopes.map((scope, index) => (
                    <Badge key={index} variant="outline" className="text-xs font-mono">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Capabilities</h4>
                <ul className="text-sm space-y-1">
                  {selectedProvider.capabilities.map((capability, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Rate Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.rateLimit.requests} requests per {selectedProvider.rateLimit.window}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Webhooks</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.webhookSupport ? 'Supported' : 'Not supported'}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Account Details Modal */}
      {selectedAccount && (
        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedAccount.avatar} />
                  <AvatarFallback>
                    {React.createElement(getProviderIcon(selectedAccount.providerId), { className: 'w-4 h-4' })}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedAccount.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{selectedAccount.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Provider</p>
                  <p className="text-muted-foreground">{selectedAccount.providerName}</p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedAccount.status)}
                    <span className={getStatusColor(selectedAccount.status)}>
                      {selectedAccount.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-muted-foreground">
                    {new Date(selectedAccount.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Last Sync</p>
                  <p className="text-muted-foreground">
                    {new Date(selectedAccount.lastSync).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedAccount.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => syncProfile(selectedAccount.id)}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Sync Profile
                </Button>
                <Button variant="outline" onClick={() => refreshToken(selectedAccount.id)}>
                  <Key className="w-3 h-3 mr-1" />
                  Refresh Token
                </Button>
                <Button variant="destructive" onClick={() => {
                  disconnectAccount(selectedAccount.id)
                  setSelectedAccount(null)
                }}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}