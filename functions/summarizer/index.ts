import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@blinkdotnew/sdk'

const blink = createClient({ projectId: 'llm-project-site-builder-dashboard-b2m28ujy', authRequired: false })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { projectId } = await req.json()
    if (!projectId) return new Response(JSON.stringify({ success: false, error: 'projectId required' }), { status: 400, headers: jsonHeaders })

    // Fetch project and recent roadmap items
    const project = await blink.db.projects.get(projectId)
    const roadmap = await blink.db.roadmapItems.list({ where: { projectId }, orderBy: { createdAt: 'desc' }, limit: 20 })

    const prompt = `Summarize the project "${project.title}" and provide a concise status report with key blockers, progress, and suggested next steps. Use the following roadmap items:\n${roadmap.map(r => `- ${r.title}: ${r.status}`).join('\n')}`

    const { text } = await blink.ai.generateText({ prompt, maxTokens: 800 })

    return new Response(JSON.stringify({ success: true, summary: text }), { headers: jsonHeaders })
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
