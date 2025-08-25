import { createClient } from '@blinkdotnew/sdk'

const baseBlink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

// Feature flags for runtime behavior (toggle LLM on/off here)
const features = {
  // Set to false during development to avoid the app getting stuck waiting on LLM responses
  llmEnabled: false
}

// When LLM is disabled, provide lightweight stub implementations to avoid runtime blocks
if (!features.llmEnabled) {
  try {
    const originalAi = (baseBlink as any).ai || {}

    const generateTextStub = async (opts: any) => {
      const prompt = (opts?.prompt || (Array.isArray(opts?.messages) ? opts.messages.map((m: any) => m.content).join(' ') : '') || '').toString().toLowerCase()

      // Heuristic-based stub responses to keep UX sensible
      if (prompt.includes('analyze the user') || prompt.includes("analyze the user's recent actions") || prompt.includes('analyze the user')) {
        return { text: JSON.stringify({ suggestions: [], nextSteps: [], insights: [] }) }
      }

      if (prompt.includes('user voice command') || prompt.includes('voice command')) {
        return { text: JSON.stringify({ type: 'info', response: 'Voice commands are disabled while LLM is offline.' }) }
      }

      // Default friendly fallback for chat / assistant
      return { text: 'LLM is temporarily disabled in this environment. This is a friendly stub response.' }
    }

    const streamTextStub = async (_opts: any, onChunk: (chunk: string) => void) => {
      onChunk('LLM disabled - streaming unavailable.')
      return
    }

    ;(baseBlink as any).ai = {
      ...originalAi,
      generateText: generateTextStub,
      streamText: streamTextStub
    }
  } catch (err) {
    // If patching fails, silently continue so app can function without AI
    console.error('Failed to patch blink.ai stubs', err)
  }
}

// expose features for runtime checks in components
;(baseBlink as any).features = features

export const blink = baseBlink
export default blink
