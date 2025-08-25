// Input validation and processing utilities

interface InputLimits {
  maxTokens: number
  maxChars: number
  warningThreshold: number
}

interface ProcessingStage {
  id: string
  content: string
  tokens: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  result?: any
  error?: string
}

interface StagedProcessingResult {
  stages: ProcessingStage[]
  totalTokens: number
  isComplete: boolean
  combinedResult?: any
}

// Default limits based on common LLM context windows
const DEFAULT_LIMITS: InputLimits = {
  maxTokens: 180000, // Conservative limit to avoid 200k context overflow
  maxChars: 720000, // Rough approximation: 4 chars per token
  warningThreshold: 150000 // Show warning at 75% of limit
}

/**
 * Estimate token count from text (rough approximation)
 * More accurate would require actual tokenizer, but this is good enough for validation
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is conservative to avoid overruns
  return Math.ceil(text.length / 3.5)
}

/**
 * Check if input exceeds limits
 */
export function validateInputLength(input: string, customLimits?: Partial<InputLimits>): {
  isValid: boolean
  tokenCount: number
  charCount: number
  exceedsLimit: boolean
  needsWarning: boolean
  limits: InputLimits
} {
  const limits = { ...DEFAULT_LIMITS, ...customLimits }
  const tokenCount = estimateTokenCount(input)
  const charCount = input.length
  
  const exceedsLimit = tokenCount > limits.maxTokens || charCount > limits.maxChars
  const needsWarning = tokenCount > limits.warningThreshold
  
  return {
    isValid: !exceedsLimit,
    tokenCount,
    charCount,
    exceedsLimit,
    needsWarning,
    limits
  }
}

/**
 * Truncate input to fit within limits while preserving meaning
 */
export function truncateInput(input: string, customLimits?: Partial<InputLimits>): {
  truncated: string
  originalLength: number
  newLength: number
  tokensSaved: number
  wasTruncated: boolean
} {
  const limits = { ...DEFAULT_LIMITS, ...customLimits }
  const validation = validateInputLength(input, limits)
  
  if (validation.isValid) {
    return {
      truncated: input,
      originalLength: input.length,
      newLength: input.length,
      tokensSaved: 0,
      wasTruncated: false
    }
  }
  
  // Calculate target length (90% of limit to be safe)
  const targetTokens = Math.floor(limits.maxTokens * 0.9)
  const targetChars = Math.floor(targetTokens * 3.5)
  
  let truncated = input
  
  // Try to truncate at natural boundaries (paragraphs, sentences)
  if (input.length > targetChars) {
    // First try to truncate at paragraph breaks
    const paragraphs = input.split('\n\n')
    let currentLength = 0
    const truncatedParagraphs: string[] = []
    
    for (const paragraph of paragraphs) {
      if (currentLength + paragraph.length + 2 <= targetChars) {
        truncatedParagraphs.push(paragraph)
        currentLength += paragraph.length + 2
      } else {
        break
      }
    }
    
    if (truncatedParagraphs.length > 0) {
      truncated = truncatedParagraphs.join('\n\n')
    } else {
      // If no complete paragraphs fit, try sentences
      const sentences = input.split(/[.!?]+\s+/)
      currentLength = 0
      const truncatedSentences: string[] = []
      
      for (const sentence of sentences) {
        if (currentLength + sentence.length + 2 <= targetChars) {
          truncatedSentences.push(sentence)
          currentLength += sentence.length + 2
        } else {
          break
        }
      }
      
      if (truncatedSentences.length > 0) {
        truncated = truncatedSentences.join('. ') + '.'
      } else {
        // Last resort: hard truncate at character limit
        truncated = input.substring(0, targetChars) + '...'
      }
    }
  }
  
  const originalTokens = estimateTokenCount(input)
  const newTokens = estimateTokenCount(truncated)
  
  return {
    truncated,
    originalLength: input.length,
    newLength: truncated.length,
    tokensSaved: originalTokens - newTokens,
    wasTruncated: true
  }
}

/**
 * Split large input into processing stages
 */
export function createProcessingStages(input: string, customLimits?: Partial<InputLimits>): ProcessingStage[] {
  const limits = { ...DEFAULT_LIMITS, ...customLimits }
  const stageTokenLimit = Math.floor(limits.maxTokens * 0.8) // 80% of limit per stage for safety
  const stageCharLimit = Math.floor(stageTokenLimit * 3.5)
  
  const stages: ProcessingStage[] = []
  
  // Try to split at natural boundaries
  const sections = input.split(/\n\n+/) // Split on double newlines (paragraphs)
  
  let currentStage = ''
  let stageIndex = 0
  
  for (const section of sections) {
    const potentialStage = currentStage + (currentStage ? '\n\n' : '') + section
    
    if (potentialStage.length <= stageCharLimit && estimateTokenCount(potentialStage) <= stageTokenLimit) {
      currentStage = potentialStage
    } else {
      // Current stage is full, save it and start new one
      if (currentStage) {
        stages.push({
          id: `stage_${stageIndex++}`,
          content: currentStage,
          tokens: estimateTokenCount(currentStage),
          status: 'pending'
        })
      }
      
      // Check if current section itself is too large
      if (section.length > stageCharLimit) {
        // Split large section into smaller chunks
        const chunks = splitLargeSection(section, stageCharLimit)
        for (const chunk of chunks) {
          stages.push({
            id: `stage_${stageIndex++}`,
            content: chunk,
            tokens: estimateTokenCount(chunk),
            status: 'pending'
          })
        }
        currentStage = ''
      } else {
        currentStage = section
      }
    }
  }
  
  // Add final stage if there's remaining content
  if (currentStage) {
    stages.push({
      id: `stage_${stageIndex}`,
      content: currentStage,
      tokens: estimateTokenCount(currentStage),
      status: 'pending'
    })
  }
  
  return stages
}

/**
 * Split a large section into smaller chunks at sentence boundaries
 */
function splitLargeSection(section: string, maxChars: number): string[] {
  const sentences = section.split(/([.!?]+\s+)/)
  const chunks: string[] = []
  let currentChunk = ''
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '')
    
    if (currentChunk.length + sentence.length <= maxChars) {
      currentChunk += sentence
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      
      // If single sentence is too long, split it further
      if (sentence.length > maxChars) {
        const words = sentence.split(' ')
        let wordChunk = ''
        
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxChars) {
            wordChunk += (wordChunk ? ' ' : '') + word
          } else {
            if (wordChunk) {
              chunks.push(wordChunk)
            }
            wordChunk = word
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk
        } else {
          currentChunk = ''
        }
      } else {
        currentChunk = sentence
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Process stages sequentially with progress tracking
 */
export async function processStagedInput<T>(
  stages: ProcessingStage[],
  processor: (content: string, stageIndex: number, totalStages: number) => Promise<T>,
  onProgress?: (completedStages: number, totalStages: number, currentStage?: ProcessingStage) => void
): Promise<StagedProcessingResult> {
  const results: T[] = []
  let completedStages = 0
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    stage.status = 'processing'
    
    onProgress?.(completedStages, stages.length, stage)
    
    try {
      const result = await processor(stage.content, i, stages.length)
      stage.result = result
      stage.status = 'completed'
      results.push(result)
      completedStages++
      
      onProgress?.(completedStages, stages.length, stage)
    } catch (error) {
      stage.error = error instanceof Error ? error.message : String(error)
      stage.status = 'error'
      
      // Decide whether to continue or stop on error
      console.error(`Stage ${i + 1} failed:`, error)
      // For now, continue processing other stages
    }
  }
  
  return {
    stages,
    totalTokens: stages.reduce((sum, stage) => sum + stage.tokens, 0),
    isComplete: stages.every(stage => stage.status === 'completed'),
    combinedResult: results
  }
}

/**
 * Get user-friendly message about input length
 */
export function getInputLengthMessage(validation: ReturnType<typeof validateInputLength>): {
  type: 'success' | 'warning' | 'error'
  message: string
  suggestion?: string
} {
  if (validation.exceedsLimit) {
    return {
      type: 'error',
      message: `Input is too long (${validation.tokenCount.toLocaleString()} tokens, ${validation.charCount.toLocaleString()} characters). Maximum allowed is ${validation.limits.maxTokens.toLocaleString()} tokens.`,
      suggestion: 'Consider shortening your input or using staged processing to handle it in smaller chunks.'
    }
  }
  
  if (validation.needsWarning) {
    return {
      type: 'warning',
      message: `Input is quite long (${validation.tokenCount.toLocaleString()} tokens). This may take longer to process.`,
      suggestion: 'Consider breaking this into smaller parts for faster processing.'
    }
  }
  
  return {
    type: 'success',
    message: `Input length is acceptable (${validation.tokenCount.toLocaleString()} tokens).`
  }
}

/**
 * Format processing progress for display
 */
export function formatProcessingProgress(completed: number, total: number, currentStage?: ProcessingStage): string {
  const percentage = Math.round((completed / total) * 100)
  const baseMessage = `Processing stage ${completed + 1} of ${total} (${percentage}%)`
  
  if (currentStage) {
    return `${baseMessage} - ${currentStage.tokens.toLocaleString()} tokens`
  }
  
  return baseMessage
}