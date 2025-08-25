import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@blinkdotnew/sdk'

const blink = createClient({ projectId: 'llm-project-site-builder-dashboard-b2m28ujy', authRequired: false })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    // Expect { botId?: string, condition?: object }
    // For prototype, we'll read bots from blink.db.bots (bots collection must be created later)
    const bots = await blink.db.bots?.list?.({}) || []

    // Evaluate simple conditions and trigger actions (prototype)
    const triggered: any[] = []
    for (const bot of bots) {
      // A bot document: { id, condition: JSON string, action: JSON string }
      const condition = JSON.parse(bot.condition || '{}')
      // Example condition: { type: 'overdue_tasks', thresholdDays: 3 }
      if (condition.type === 'overdue_tasks') {
        // find roadmap items overdue
        const overdue = await blink.db.roadmapItems.list({ where: { status: 'todo' } })
        // simple filter by due date < now - thresholdDays
        const now = Date.now()
        const matches = overdue.filter((r: any) => {
          if (!r.dueDate) return false
          const due = new Date(r.dueDate).getTime()
          return now - due > (condition.thresholdDays || 3) * 24 * 60 * 60 * 1000
        })

        if (matches.length) {
          // trigger action - for prototype we will create a task or send a notification record
          triggered.push({ botId: bot.id, matches: matches.length })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, triggered }), { headers: jsonHeaders })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500, headers: jsonHeaders })
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

const jsonHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders
}
