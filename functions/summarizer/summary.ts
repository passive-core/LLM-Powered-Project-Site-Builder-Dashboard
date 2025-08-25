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

    // Get generated assets and summaries
    const generatedAssets = await blink.db.generatedAssets.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    const projects = await blink.db.projects.list({
      where: { userId: user.id }
    })

    const total = generatedAssets.length
    const recentAssets = generatedAssets.filter((asset: any) => {
      const createdAt = new Date(asset.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return createdAt > weekAgo
    }).length

    const byType = generatedAssets.reduce((acc: any, asset: any) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1
      return acc
    }, {})

    const healthScore = Math.min(100, Math.max(60, 70 + (recentAssets * 5)))

    const summary = {
      status: healthScore > 85 ? 'healthy' : healthScore > 70 ? 'warning' : 'error',
      metrics: {
        total,
        active: recentAssets,
        completed: total - recentAssets,
        pending: Math.max(0, projects.length - total)
      },
      healthScore,
      trend: recentAssets > 5 ? 'up' : recentAssets < 2 ? 'down' : 'stable',
      details: {
        byType,
        recentActivity: recentAssets,
        avgPerProject: projects.length > 0 ? Math.round(total / projects.length * 10) / 10 : 0
      },
      lastUpdated: new Date().toISOString()
    }

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    console.error('Error in summarizer summary:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})