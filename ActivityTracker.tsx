import React, { useState, useEffect, useCallback } from 'react'
import { Activity, Clock, Calendar, Search, ExternalLink } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface ActivityLog {
  id: string
  action: string
  description: string
  category: string
  metadata: string
  projectId?: string
  platformId?: string
  userId: string
  createdAt: string
}

interface ActivityStats {
  total24h: number
  total7d: number
  total30d: number
  categories: { [key: string]: number }
}

export function ActivityTracker() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats>({
    total24h: 0,
    total7d: 0,
    total30d: 0,
    categories: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('7d')
  const { user } = useAuth()

  const loadActivities = useCallback(async () => {
    if (!user) return
    try {
      const activitiesData = await blink.db.activityLogs.list({
        orderBy: { createdAt: 'desc' },
        limit: 500
      })
      setActivities(activitiesData)
      // compute stats after setting activities
      const now = new Date()
      const day24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const day7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const day30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const computed = activitiesData.reduce((acc, activity) => {
        const activityDate = new Date(activity.createdAt)
        if (activityDate >= day24h) acc.total24h++
        if (activityDate >= day7d) acc.total7d++
        if (activityDate >= day30d) acc.total30d++
        acc.categories[activity.category] = (acc.categories[activity.category] || 0) + 1
        return acc
      }, {
        total24h: 0,
        total7d: 0,
        total30d: 0,
        categories: {} as { [key: string]: number }
      })

      setStats(computed)
    } catch (error) {
      console.error('Failed to load activities:', error)
      toast.error('Failed to load activity data')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user, loadActivities])

  useEffect(() => {
    // Inline filtering to avoid creating a new function each render and satisfy hooks lint
    let filtered = activities

    if (timeFilter !== 'all') {
      const now = new Date()
      let cutoffDate: Date
      switch (timeFilter) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }
      filtered = filtered.filter(activity => new Date(activity.createdAt) >= cutoffDate)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(activity => activity.category === categoryFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, categoryFilter, timeFilter])

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Project Management': 'bg-blue-100 text-blue-800',
      'Domain Management': 'bg-green-100 text-green-800',
      'AI Operations': 'bg-purple-100 text-purple-800',
      'System': 'bg-gray-100 text-gray-800',
      'Integration': 'bg-orange-100 text-orange-800',
      'Security': 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading activity data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Tracker</h2>
          <p className="text-muted-foreground">Monitor all actions and changes across your projects and platforms</p>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Last 24 Hours</p>
              <p className="text-2xl font-bold">{stats.total24h}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Last 7 Days</p>
              <p className="text-2xl font-bold">{stats.total7d}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Last 30 Days</p>
              <p className="text-2xl font-bold">{stats.total30d}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(stats.categories).map(category => (
                <SelectItem key={category} value={category}>
                  {category} ({stats.categories[category]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Activity Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        {filteredActivities.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activities found</h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Activities will appear here as you use the platform'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{activity.action}</h4>
                        <Badge className={getCategoryColor(activity.category)}>
                          {activity.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(activity.createdAt)}</span>
                        <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        {activity.projectId && (
                          <span className="flex items-center">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Project: {activity.projectId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(stats.categories).map(([category, count]) => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground">{category}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ActivityTracker