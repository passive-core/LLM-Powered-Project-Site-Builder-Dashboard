import React, { useState, useEffect } from 'react'
import { Server, DollarSign, Activity, TrendingUp, AlertTriangle, CheckCircle, Settings } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface Platform {
  id: string
  name: string
  type: string
  subscriptionPlan: string
  monthlyCost: number
  usageLimit: string
  currentUsage: number
  usageUnit: string
  status: 'active' | 'inactive' | 'warning'
  apiEndpoint?: string
  lastUpdated: string
  userId: string
}

interface UsageStats {
  totalCost: number
  activeServices: number
  warningServices: number
  totalUsage: string
}

export function PlatformsManager() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalCost: 0,
    activeServices: 0,
    warningServices: 0,
    totalUsage: '0'
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadPlatforms()
    }
  }, [user])

  const loadPlatforms = async () => {
    try {
      const platformsData = await blink.db.platforms.list({
        orderBy: { lastUpdated: 'desc' }
      })
      
      setPlatforms(platformsData)
      
      // Calculate usage stats
      const stats = platformsData.reduce((acc, platform) => {
        acc.totalCost += platform.monthlyCost || 0
        if (platform.status === 'active') acc.activeServices++
        if (platform.status === 'warning') acc.warningServices++
        return acc
      }, {
        totalCost: 0,
        activeServices: 0,
        warningServices: 0,
        totalUsage: '0'
      })
      
      setUsageStats(stats)
    } catch (error) {
      console.error('Failed to load platforms:', error)
      toast.error('Failed to load platforms data')
    } finally {
      setIsLoading(false)
    }
  }

  const getUsagePercentage = (current: number, limit: string) => {
    const numericLimit = parseFloat(limit.replace(/[^0-9.]/g, ''))
    if (!numericLimit) return 0
    return Math.min((current / numericLimit) * 100, 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'inactive': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'inactive': return <Badge className="bg-red-100 text-red-800">Inactive</Badge>
      default: return <Badge>Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading platforms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platforms & Tools</h2>
          <p className="text-muted-foreground">Monitor your subscriptions, usage, and costs across all platforms</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Manage Integrations
        </Button>
      </div>

      {/* Usage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-2xl font-bold">${usageStats.totalCost}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Services</p>
              <p className="text-2xl font-bold">{usageStats.activeServices}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold">{usageStats.warningServices}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Platforms</p>
              <p className="text-2xl font-bold">{platforms.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Platforms List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Platform Details</h3>
        {platforms.length === 0 ? (
          <Card className="p-8 text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No platforms configured</h3>
            <p className="text-muted-foreground mb-4">
              Connect your platforms and tools to monitor usage and costs
            </p>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {platforms.map((platform) => {
              const usagePercentage = getUsagePercentage(platform.currentUsage, platform.usageLimit)
              return (
                <Card key={platform.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Server className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{platform.name}</h4>
                        <p className="text-sm text-muted-foreground">{platform.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(platform.status)}
                      <span className="text-sm font-medium">${platform.monthlyCost}/mo</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subscription: {platform.subscriptionPlan}</span>
                      <span>Updated: {new Date(platform.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage: {platform.currentUsage} {platform.usageUnit}</span>
                        <span>Limit: {platform.usageLimit}</span>
                      </div>
                      <Progress value={usagePercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{usagePercentage.toFixed(1)}% used</span>
                        <span className={usagePercentage > 80 ? 'text-red-600' : usagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'}>
                          {usagePercentage > 80 ? 'High usage' : usagePercentage > 60 ? 'Moderate usage' : 'Normal usage'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Usage Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Cost Breakdown</h4>
            <div className="space-y-2">
              {platforms.filter(p => p.monthlyCost > 0).map(platform => (
                <div key={platform.id} className="flex justify-between text-sm">
                  <span>{platform.name}</span>
                  <span>${platform.monthlyCost}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">High Usage Alerts</h4>
            <div className="space-y-2">
              {platforms.filter(p => getUsagePercentage(p.currentUsage, p.usageLimit) > 70).map(platform => (
                <div key={platform.id} className="flex items-center justify-between text-sm">
                  <span>{platform.name}</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {getUsagePercentage(platform.currentUsage, platform.usageLimit).toFixed(0)}%
                  </Badge>
                </div>
              ))}
              {platforms.filter(p => getUsagePercentage(p.currentUsage, p.usageLimit) > 70).length === 0 && (
                <p className="text-sm text-muted-foreground">All platforms within normal usage limits</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PlatformsManager