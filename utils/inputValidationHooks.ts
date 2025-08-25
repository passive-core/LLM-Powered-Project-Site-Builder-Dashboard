// Separate file for hooks to fix react-refresh lint issues

import { useState } from 'react'
import { createProcessingStages, processStagedInput } from './inputValidation'

// Hook for staged processing with progress tracking
export function useStagedProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentStage: null as any })
  const [results, setResults] = useState<any>(null)
  
  const processInStages = async (
    input: string,
    processor: (content: string, stageIndex: number, totalStages: number) => Promise<any>
  ) => {
    setIsProcessing(true)
    setResults(null)
    
    try {
      const stages = createProcessingStages(input)
      
      const result = await processStagedInput(
        stages,
        processor,
        (completed, total, currentStage) => {
          setProgress({ completed, total, currentStage })
        }
      )
      
      setResults(result)
      return result
    } catch (error) {
      console.error('Staged processing failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
      setProgress({ completed: 0, total: 0, currentStage: null })
    }
  }
  
  return {
    isProcessing,
    progress,
    results,
    processInStages
  }
}