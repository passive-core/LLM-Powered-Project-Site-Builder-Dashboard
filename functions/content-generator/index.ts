import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@blinkdotnew/sdk'

const blink = createClient({ projectId: 'llm-project-site-builder-dashboard-b2m28ujy', authRequired: false })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { type, description, options } = await req.json()
    if (!type || !description) return new Response(JSON.stringify({ success: false, error: 'type and description required' }), { status: 400, headers: jsonHeaders })

    // Map type to prompts/templates
    let prompt = ''
    if (type === 'marketing') {
      prompt = `Write marketing copy for: ${description}`
    } else if (type === 'code') {
      prompt = `Generate code scaffold for: ${description}`
    } else if (type === 'landing') {
      prompt = `Generate a responsive landing page (HTML + Tailwind CSS) for: ${description}`
    } else {
      prompt = `Generate content for type:${type} - ${description}`
    }

    const { text } = await blink.ai.generateText({ prompt, maxTokens: 1200 })

    // Optionally save asset
    let saved = null
    if (options?.saveToProject && options.projectId) {
      const asset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        name: options.name || `${type} generated ${new Date().toISOString()}`,
        content: text,
        projectId: options.projectId,
        createdAt: new Date().toISOString()
      }
      await blink.db.generatedAssets.create(asset)
      saved = asset
    }

    return new Response(JSON.stringify({ success: true, content: text, saved }), { headers: jsonHeaders })
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
