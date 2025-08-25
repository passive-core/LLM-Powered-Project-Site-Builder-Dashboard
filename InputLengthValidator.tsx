import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Info, Scissors, Layers, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/Button'
import { Progress } from './ui/progress'
import { Badge } from './ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  validateInputLength, 
  truncateInput, 
  createProcessingStages, 
  processStagedInput,
  getInputLengthMessage,
  formatProcessingProgress,
  estimateTokenCount
} from '../utils/inputValidation'

interface InputLengthValidatorProps {
  input: string
  onInputChange: (input: string) => void
  onProcessingModeChange: (mode: 'normal' | 'truncated' | 'staged') => void
  className?: string
}

interface StagedProcessingProps {
  input: string
  onProcess: (processor: (content: string, stageIndex: number, totalStages: number) => Promise<any>) => Promise<any>
  isProcessing: boolean
}

export function InputLengthValidator({ 
  input, 
  onInputChange, 
  onProcessingModeChange,
  className = '' 
}: InputLengthValidatorProps) {
  const [validation, setValidation] = useState(validateInputLength(''))
  const [showDetails, setShowDetails] = useState(false)
  const [processingMode, setProcessingMode] = useState<'normal' | 'truncated' | 'staged'>('normal')
  
  useEffect(() => {
    const newValidation = validateInputLength(input)
    setValidation(newValidation)
    
    // Auto-suggest processing mode based on input length
    if (newValidation.exceedsLimit) {
      setProcessingMode('truncated')
      onProcessingModeChange('truncated')
    } else if (newValidation.needsWarning) {
      setProcessingMode('staged')
      onProcessingModeChange('staged')
    } else {
      setProcessingMode('normal')
      onProcessingModeChange('normal')
    }
  }, [input, onProcessingModeChange])
  
  const message = getInputLengthMessage(validation)
  
  const handleTruncate = () => {
    const result = truncateInput(input)
    onInputChange(result.truncated)
    setProcessingMode('truncated')
    onProcessingModeChange('truncated')
  }
  
  const handleStagedProcessing = () => {
    setProcessingMode('staged')
    onProcessingModeChange('staged')
  }
  
  if (!input.trim()) {
    return null
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Status Alert */}
      <Alert className={`${
        message.type === 'error' ? 'border-red-200 bg-red-50' :
        message.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
        'border-green-200 bg-green-50'
      }`}>
        <div className="flex items-start gap-2">
          {message.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
          ) : message.type === 'warning' ? (
            <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {message.message}
              {message.suggestion && (
                <div className="mt-1 text-xs opacity-80">
                  {message.suggestion}
                </div>
              )}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </Alert>
      
      {/* Detailed Information */}
      {showDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Input Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Token Count</div>
                <div className="text-muted-foreground">
                  {validation.tokenCount.toLocaleString()} / {validation.limits.maxTokens.toLocaleString()}
                </div>
                <Progress 
                  value={(validation.tokenCount / validation.limits.maxTokens) * 100} 
                  className="h-2 mt-1"
                />
              </div>
              <div>
                <div className="font-medium">Character Count</div>
                <div className="text-muted-foreground">
                  {validation.charCount.toLocaleString()} / {validation.limits.maxChars.toLocaleString()}
                </div>
                <Progress 
                  value={(validation.charCount / validation.limits.maxChars) * 100} 
                  className="h-2 mt-1"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={processingMode === 'normal' ? 'default' : 'secondary'}>
                Current Mode: {processingMode}
              </Badge>
              {validation.exceedsLimit && (
                <Badge variant="destructive">Exceeds Limit</Badge>
              )}
              {validation.needsWarning && !validation.exceedsLimit && (
                <Badge variant="outline">Large Input</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Action Buttons */}
      {(validation.exceedsLimit || validation.needsWarning) && (
        <div className="flex gap-2">
          {validation.exceedsLimit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTruncate}
              className="flex items-center gap-1"
            >
              <Scissors className="h-3 w-3" />
              Truncate Input
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStagedProcessing}
                className="flex items-center gap-1"
              >
                <Layers className="h-3 w-3" />
                Process in Stages
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Staged Processing</DialogTitle>
              </DialogHeader>
              <StagedProcessingPreview input={input} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

// Component to preview staged processing
function StagedProcessingPreview({ input }: { input: string }) {
  const [stages] = useState(() => createProcessingStages(input))
  const [selectedStage, setSelectedStage] = useState(0)
  
  const totalTokens = stages.reduce((sum, stage) => sum + stage.tokens, 0)
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Your input will be processed in {stages.length} stages, totaling {totalTokens.toLocaleString()} tokens.
      </div>
      
      <Tabs value={selectedStage.toString()} onValueChange={(value) => setSelectedStage(parseInt(value))}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(stages.length, 5)}, 1fr)` }}>
          {stages.slice(0, 5).map((stage, index) => (
            <TabsTrigger key={stage.id} value={index.toString()} className="text-xs">
              Stage {index + 1}
              <Badge variant="outline" className="ml-1 text-xs">
                {stage.tokens.toLocaleString()}
              </Badge>
            </TabsTrigger>
          ))}
          {stages.length > 5 && (
            <TabsTrigger value="more" disabled className="text-xs">
              +{stages.length - 5} more
            </TabsTrigger>
          )}
        </TabsList>
        
        {stages.slice(0, 5).map((stage, index) => (
          <TabsContent key={stage.id} value={index.toString()}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Stage {index + 1} of {stages.length}
                  <Badge variant="outline">
                    {stage.tokens.toLocaleString()} tokens
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded text-sm max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{stage.content}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="text-xs text-muted-foreground">
        Each stage will be processed independently, and results will be combined at the end.
      </div>
    </div>
  )
}

// Hook moved to separate file to fix lint issues

// Progress indicator for staged processing
export function StagedProcessingProgress({ 
  completed, 
  total, 
  currentStage 
}: { 
  completed: number
  total: number
  currentStage?: any 
}) {
  if (total === 0) return null
  
  const percentage = Math.round((completed / total) * 100)
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{formatProcessingProgress(completed, total, currentStage)}</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </div>
        
        {currentStage && (
          <div className="mt-2 text-xs text-muted-foreground">
            Processing: {currentStage.tokens.toLocaleString()} tokens
          </div>
        )}
      </CardContent>
    </Card>
  )
}