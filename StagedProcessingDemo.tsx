import React, { useState } from 'react'
import { Play, Pause, RotateCcw, FileText, Layers, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/Textarea'
import { Badge } from './ui/Badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { InputLengthValidator } from './InputLengthValidator'
import { useStagedProcessing, StagedProcessingProgress } from './InputLengthValidatorExports'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

interface DemoResult {
  stageIndex: number
  input: string
  output: string
  tokens: number
  processingTime: number
}

export function StagedProcessingDemo() {
  const [input, setInput] = useState('')
  const [processingMode, setProcessingMode] = useState<'normal' | 'truncated' | 'staged'>('normal')
  const [results, setResults] = useState<DemoResult[]>([])
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const { user } = useAuth()
  
  const { isProcessing, progress, processInStages } = useStagedProcessing()
  
  const handleDemo = async () => {
    if (!input.trim() || !user) return
    
    setResults([])
    setSelectedResult(null)
    
    try {
      if (processingMode === 'staged') {
        // Demonstrate staged processing
        const result = await processInStages(input, async (content, stageIndex, totalStages) => {
          const startTime = Date.now()
          
          // Simulate AI processing with actual API call
          const { text } = await blink.ai.generateText({
            prompt: `Analyze and summarize this content (Stage ${stageIndex + 1} of ${totalStages}):\n\n${content}`,
            maxTokens: 500
          })
          
          const processingTime = Date.now() - startTime
          
          const stageResult: DemoResult = {
            stageIndex,
            input: content,
            output: text,
            tokens: Math.ceil(content.length / 3.5), // Rough token estimate
            processingTime
          }
          
          setResults(prev => [...prev, stageResult])
          
          return stageResult
        })
        
        console.log('Staged processing completed:', result)
      } else {
        // Normal or truncated processing
        const startTime = Date.now()
        
        let finalInput = input
        if (processingMode === 'truncated') {
          const { truncateInput } = await import('../utils/inputValidation')
          const truncated = truncateInput(input)
          finalInput = truncated.truncated
        }
        
        const { text } = await blink.ai.generateText({
          prompt: `Analyze and summarize this content:\n\n${finalInput}`,
          maxTokens: 1000
        })
        
        const processingTime = Date.now() - startTime
        
        const result: DemoResult = {
          stageIndex: 0,
          input: finalInput,
          output: text,
          tokens: Math.ceil(finalInput.length / 3.5),
          processingTime
        }
        
        setResults([result])
      }
    } catch (error) {
      console.error('Demo processing failed:', error)
    }
  }
  
  const handleReset = () => {
    setInput('')
    setResults([])
    setSelectedResult(null)
    setProcessingMode('normal')
  }
  
  const totalProcessingTime = results.reduce((sum, result) => sum + result.processingTime, 0)
  const totalTokens = results.reduce((sum, result) => sum + result.tokens, 0)
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Staged Processing Demo</h3>
        <p className="text-sm text-muted-foreground">
          Test how the system handles large inputs with automatic truncation or staged processing.
        </p>
      </div>
      
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Input Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a large amount of text here to test input length validation and staged processing..."
            rows={8}
            className="font-mono text-sm"
          />
          
          <InputLengthValidator
            input={input}
            onInputChange={setInput}
            onProcessingModeChange={setProcessingMode}
          />
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDemo}
              disabled={!input.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Pause className="h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Demo
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <Badge variant={processingMode === 'normal' ? 'default' : 'secondary'}>
              Mode: {processingMode}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Processing Progress */}
      {isProcessing && (
        <StagedProcessingProgress
          completed={progress.completed}
          total={progress.total}
          currentStage={progress.currentStage}
        />
      )}
      
      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Processing Results
              <div className="flex items-center gap-2 text-sm font-normal">
                <Badge variant="outline">
                  {results.length} {results.length === 1 ? 'stage' : 'stages'}
                </Badge>
                <Badge variant="outline">
                  {totalTokens.toLocaleString()} tokens
                </Badge>
                <Badge variant="outline">
                  {totalProcessingTime}ms
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 1 ? (
              // Single result display
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Processing Complete</span>
                  <Badge variant="outline">{results[0].processingTime}ms</Badge>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI Analysis Result:</h4>
                  <div className="text-sm whitespace-pre-wrap">{results[0].output}</div>
                </div>
              </div>
            ) : (
              // Multiple stages display
              <Tabs value={selectedResult?.toString() || '0'} onValueChange={(value) => setSelectedResult(parseInt(value))}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(results.length, 4)}, 1fr)` }}>
                  {results.slice(0, 4).map((result, index) => (
                    <TabsTrigger key={index} value={index.toString()} className="text-xs">
                      Stage {result.stageIndex + 1}
                      <Badge variant="outline" className="ml-1 text-xs">
                        {result.processingTime}ms
                      </Badge>
                    </TabsTrigger>
                  ))}
                  {results.length > 4 && (
                    <TabsTrigger value="more" disabled className="text-xs">
                      +{results.length - 4} more
                    </TabsTrigger>
                  )}
                </TabsList>
                
                {results.slice(0, 4).map((result, index) => (
                  <TabsContent key={index} value={index.toString()}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">
                            Stage {result.stageIndex + 1} Complete
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {result.tokens.toLocaleString()} tokens
                          </Badge>
                          <Badge variant="outline">
                            {result.processingTime}ms
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Input (Stage {result.stageIndex + 1}):</h4>
                          <div className="bg-muted p-3 rounded text-xs max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{result.input}</pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">AI Analysis Result:</h4>
                          <div className="bg-muted p-3 rounded text-xs max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{result.output}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
            
            {/* Summary for multiple stages */}
            {results.length > 1 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Processing Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Total Stages</div>
                    <div className="text-muted-foreground">{results.length}</div>
                  </div>
                  <div>
                    <div className="font-medium">Total Tokens</div>
                    <div className="text-muted-foreground">{totalTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Total Time</div>
                    <div className="text-muted-foreground">{totalProcessingTime}ms</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Average processing time per stage: {Math.round(totalProcessingTime / results.length)}ms
                  </div>
                  <Progress 
                    value={100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-blue-500" />
            <div>
              <div className="font-medium">Normal Processing</div>
              <div className="text-muted-foreground">Input under 150k tokens processes normally in a single request.</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
            <div>
              <div className="font-medium">Truncated Processing</div>
              <div className="text-muted-foreground">Input over 180k tokens gets automatically truncated to fit context limits.</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Layers className="h-4 w-4 mt-0.5 text-purple-500" />
            <div>
              <div className="font-medium">Staged Processing</div>
              <div className="text-muted-foreground">Large inputs are split into smaller chunks and processed sequentially, then combined.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}