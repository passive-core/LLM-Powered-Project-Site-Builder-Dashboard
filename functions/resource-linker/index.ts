import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@blinkdotnew/sdk'

const blink = createClient({ projectId: 'llm-project-site-builder-dashboard-b2m28ujy', authRequired: false })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { query, projectId } = await req.json()
    if (!query) return new Response(JSON.stringify({ success: false, error: 'query required' }), { status: 400, headers: jsonHeaders })

    // Search generatedAssets and simple knowledge base tables
    const assets = await blink.db.generatedAssets.list({ where: { projectId } })

    // Use AI to score relevance
    const prompt = `You are a resource recommender. Given query: "${query}" and ${assets.length} assets, recommend the top 5 most relevant resources with short explanations.`
    const { text } = await blink.ai.generateText({ prompt, maxTokens: 600 })

    return new Response(JSON.stringify({ success: true, recommendations: text }), { headers: jsonHeaders })
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
