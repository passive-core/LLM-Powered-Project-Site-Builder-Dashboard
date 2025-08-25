import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { useBuildOptimization, useMemoryMonitor } from '../hooks/useBuildOptimization'
import { Zap, Cpu, HardDrive, RefreshCw } from 'lucide-react'
import { sendAlert } from '../services/alerts'

interface BuildOptimizationStatusProps {
  className?: string
}

const TrendSparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (!values || values.length === 0) return null
  const width = 120
  const height = 30
  const max = Math.max(...values, 100)
  const min = Math.min(...values, 0)
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * width
    const y = height - ((v - min) / (max - min || 1)) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke="#6366f1" strokeWidth={2} points={points} />
    </svg>
  )
}

const BuildOptimizationStatus: React.FC<BuildOptimizationStatusProps> = ({ className }) => {
  const [buildState, buildActions] = useBuildOptimization()
  const memoryInfo = useMemoryMonitor()
  const [alertThreshold, setAlertThreshold] = useState(85)
  const [alertSent, setAlertSent] = useState(false)

  useEffect(() => {
    if (buildState.history && buildState.history.length > 0) {
      const latest = buildState.history[buildState.history.length - 1]
      if (latest >= alertThreshold && !alertSent) {
        // send alert via service (placeholder)
        sendAlert({
          title: 'Memory threshold exceeded',
          message: `Memory usage at ${Math.round(latest)}% exceeded threshold ${alertThreshold}%`
        })
        setAlertSent(true)
      }

      if (latest < alertThreshold) setAlertSent(false)
    }
  }, [buildState.history, alertThreshold, alertSent])

  const getStatusColor = (isOptimized: boolean, isNearLimit: boolean) => {
    if (isNearLimit) return 'destructive'
    if (isOptimized) return 'default'
    return 'secondary'
  }

  const getStatusText = (isOptimized: boolean, isNearLimit: boolean) => {
    if (isNearLimit) return 'Memory Limit'
    if (isOptimized) return 'Optimized'
    return 'Standard'
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4" />
          Build Optimization Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={getStatusColor(buildState.isOptimized, buildState.isNearLimit)}>
            {getStatusText(buildState.isOptimized, buildState.isNearLimit)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />Memory Usage</span>
            <span className="text-muted-foreground">{Math.round(memoryInfo.percentage)}%</span>
          </div>
          <Progress value={memoryInfo.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(memoryInfo.used / 1000).toFixed(1)}KB used</span>
            <span>{(memoryInfo.available / 1000).toFixed(1)}KB available</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm items-center">
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-muted-foreground" />
            <div>
              <div className="font-medium">{buildState.componentsLoaded}</div>
              <div className="text-xs text-muted-foreground">Components</div>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <div className="mr-3 text-xs text-muted-foreground">Recent Trend</div>
            <TrendSparkline values={buildState.history || []} />
          </div>
        </div>

        {buildState.isNearLimit && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm font-medium text-destructive mb-1">Memory Limit Reached</div>
            <div className="text-xs text-destructive/80">Context size is near the limit. Some components may load slowly.</div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={buildActions.optimizeMemory} className="flex-1"><RefreshCw className="w-3 h-3 mr-1" />Optimize</Button>
          <Button variant="outline" size="sm" onClick={buildActions.cleanup} className="flex-1">Cleanup</Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Alerts</div>
          <div className="flex items-center gap-2">
            <input type="range" min={50} max={100} value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))} />
            <div className="text-sm">Threshold: {alertThreshold}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BuildOptimizationStatus
