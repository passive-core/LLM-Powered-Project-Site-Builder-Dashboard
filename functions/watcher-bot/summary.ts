import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@blinkdotnew/sdk"

const blink = createClient({
  projectId: Deno.env.get('BLINK_PROJECT_ID') || '',
  authRequired: false
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      const jwt = authHeader.replace('Bearer ', '')
      blink.auth.setToken(jwt)
    }

    const user = await blink.auth.me()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Get activity logs for bot actions
    const botActivities = await blink.db.activityLogs.list({
      where: { userId: user.id, category: 'bot' },
      orderBy: { createdAt: 'desc' },
      limit: 100
    })

    const projects = await blink.db.projects.list({
      where: { userId: user.id }
    })

    const total = botActivities.length
    const recentActivities = botActivities.filter((activity: any) => {
      const createdAt = new Date(activity.createdAt)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return createdAt > dayAgo
    }).length

    const activeProjects = projects.filter((p: any) => p.status === 'in_progress').length
    const monitoredProjects = projects.filter((p: any) => {
      const healthCheck = new Date(p.lastHealthCheck || 0)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return healthCheck > weekAgo
    }).length

    const healthScore = Math.min(100, Math.max(50, 60 + (recentActivities * 8) + (monitoredProjects * 5)))

    const summary = {
      status: healthScore > 80 ? 'healthy' : healthScore > 65 ? 'warning' : 'error',
      metrics: {
        total,
        active: recentActivities,
        completed: total - recentActivities,
        pending: Math.max(0, activeProjects - monitoredProjects)
      },
      healthScore,
      trend: recentActivities > 10 ? 'up' : recentActivities < 3 ? 'down' : 'stable',
      details: {
        recentActivities,
        monitoredProjects,
        activeProjects,
        automationRate: activeProjects > 0 ? Math.round((monitoredProjects / activeProjects) * 100) : 100
      },
      lastUpdated: new Date().toISOString()
    }

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    console.error('Error in watcher bot summary:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})