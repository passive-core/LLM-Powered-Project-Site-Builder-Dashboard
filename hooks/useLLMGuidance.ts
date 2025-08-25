import React, { useState } from 'react'
import { LLMGuidanceSystem } from '../components/LLMGuidanceSystem'
import { blink } from '../blink/client'

// Global hook to integrate with the guidance system
export const useLLMGuidance = () => {
  const [isVisible, setIsVisible] = useState(true)
  
  const toggleGuidance = () => setIsVisible(!isVisible)
  
  const GuidanceComponent = () => {
    // When LLM is disabled, return a simple notice using createElement (avoid JSX in .ts file)
    if (!(blink as any).features?.llmEnabled) {
      return React.createElement('div', { className: 'fixed bottom-4 right-4 w-80 p-3 bg-card border rounded shadow z-50' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'text-sm font-medium' }, 'LLM Guidance'),
          React.createElement('button', { className: 'text-xs text-muted-foreground', onClick: toggleGuidance }, '×')
        ),
        React.createElement('p', { className: 'text-xs text-muted-foreground mt-2' }, "LLM is temporarily disabled. Guidance is paused to keep the app responsive. We'll re-enable it later.")
      )
    }

    return LLMGuidanceSystem({ isVisible, onToggle: toggleGuidance })
  }

  return {
    isVisible,
    toggleGuidance,
    GuidanceComponent
  }
}