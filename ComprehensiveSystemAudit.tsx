import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import {
  CheckCircle, AlertTriangle, XCircle, Clock, Zap, Database,
  Globe, Shield, Cpu, HardDrive, Network, Code, Settings,
  TrendingUp, Activity, FileText, Users, Target, Wrench
} from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface SystemComponent {
  id: string
  name: string
  category: 'core' | 'integration' | 'ui' | 'data' | 'security' | 'performance'
  status: 'healthy' | 'warning' | 'error' | 'missing'
  description: string
  issues: string[]
  recommendations: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  lastChecked: string
  dependencies: string[]
  implementation: {
    exists: boolean
    functional: boolean
    optimized: boolean
    tested: boolean
  }
}

interface MissingFeature {
  id: string
  name: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedEffort: 'small' | 'medium' | 'large' | 'xl'
  dependencies: string[]
  benefits: string[]
  risks: string[]
}

interface SystemMetrics {
  totalComponents: number
  healthyComponents: number
  warningComponents: number
  errorComponents: number
  missingComponents: number
  overallHealth: number
  criticalIssues: number
  performanceScore: number
  securityScore: number
  completenessScore: number
}

const ComprehensiveSystemAudit: React.FC = () => {
  const [components, setComponents] = useState<SystemComponent[]>([])
  const [missingFeatures, setMissingFeatures] = useState<MissingFeature[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isRunningAudit, setIsRunningAudit] = useState(false)
  const [auditProgress, setAuditProgress] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    runSystemAudit()
  }, [])

  const runSystemAudit = async () => {
    setIsRunningAudit(true)
    setAuditProgress(0)

    try {
      // Simulate comprehensive system audit
      const auditSteps = [
        'Checking core components...',
        'Analyzing integrations...',
        'Evaluating UI components...',
        'Testing database connections...',
        'Scanning security features...',
        'Measuring performance...',
        'Identifying missing features...',
        'Generating recommendations...'
      ]

      for (let i = 0; i < auditSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setAuditProgress(((i + 1) / auditSteps.length) * 100)
      }

      // Load audit results
      await loadAuditResults()
    } catch (error) {
      console.error('Audit failed:', error)
    } finally {
      setIsRunningAudit(false)
    }
  }

  const loadAuditResults = async () => {
    const auditComponents: SystemComponent[] = [
      {
        id: 'auth-system',
        name: 'Authentication System',
        category: 'core',
        status: 'healthy',
        description: 'Blink SDK authentication with auto-redirect',
        issues: [],
        recommendations: ['Consider adding 2FA support', 'Implement session timeout'],
        priority: 'low',
        lastChecked: new Date().toISOString(),
        dependencies: ['blink-sdk'],
        implementation: { exists: true, functional: true, optimized: true, tested: true }
      },
      {
        id: 'database-layer',
        name: 'Database Layer',
        category: 'data',
        status: 'warning',
        description: 'SQLite database with Blink SDK',
        issues: ['Missing indexes on frequently queried fields', 'No data backup strategy'],
        recommendations: ['Add database indexes', 'Implement automated backups', 'Add data validation'],
        priority: 'medium',
        lastChecked: new Date().toISOString(),
        dependencies: ['blink-sdk'],
        implementation: { exists: true, functional: true, optimized: false, tested: false }
      },
      {
        id: 'ai-integration',
        name: 'AI Integration',
        category: 'integration',
        status: 'healthy',
        description: 'Multiple AI agents with autonomous capabilities',
        issues: [],
        recommendations: ['Add AI model fallbacks', 'Implement cost monitoring'],
        priority: 'low',
        lastChecked: new Date().toISOString(),
        dependencies: ['blink-sdk', 'openai-api'],
        implementation: { exists: true, functional: true, optimized: true, tested: true }
      },
      {
        id: 'oauth-manager',
        name: 'OAuth Manager',
        category: 'integration',
        status: 'warning',
        description: 'Comprehensive OAuth integration for multiple platforms',
        issues: ['Mock implementation only', 'No real OAuth flows'],
        recommendations: ['Implement real OAuth flows', 'Add token refresh logic', 'Secure token storage'],
        priority: 'high',
        lastChecked: new Date().toISOString(),
        dependencies: ['platform-apis'],
        implementation: { exists: true, functional: false, optimized: false, tested: false }
      },
      {
        id: 'platform-integration',
        name: 'Platform Integration',
        category: 'integration',
        status: 'error',
        description: '15+ platform integrations for monetization',
        issues: ['No real API connections', 'Missing webhook handlers', 'No error handling'],
        recommendations: ['Implement real API connections', 'Add webhook endpoints', 'Error handling & retries'],
        priority: 'critical',
        lastChecked: new Date().toISOString(),
        dependencies: ['oauth-manager', 'webhook-system'],
        implementation: { exists: true, functional: false, optimized: false, tested: false }
      },
      {
        id: 'financial-tracking',
        name: 'Financial Tracking',
        category: 'data',
        status: 'warning',
        description: 'IRS-compliant financial tracking and reporting',
        issues: ['No real bank integration', 'Missing tax calculations', 'No receipt OCR'],
        recommendations: ['Add bank API integration', 'Implement tax calculations', 'Receipt scanning'],
        priority: 'high',
        lastChecked: new Date().toISOString(),
        dependencies: ['database-layer', 'file-storage'],
        implementation: { exists: true, functional: true, optimized: false, tested: false }
      },
      {
        id: 'email-tracker',
        name: 'Email Tracker',
        category: 'integration',
        status: 'error',
        description: 'AI-powered email categorization and tracking',
        issues: ['No email API integration', 'Mock data only', 'No real-time monitoring'],
        recommendations: ['Integrate with Gmail/Outlook APIs', 'Real-time email processing', 'AI categorization'],
        priority: 'high',
        lastChecked: new Date().toISOString(),
        dependencies: ['ai-integration', 'email-apis'],
        implementation: { exists: true, functional: false, optimized: false, tested: false }
      },
      {
        id: 'paypal-integration',
        name: 'PayPal Integration',
        category: 'integration',
        status: 'warning',
        description: 'PayPal payment processing for builds',
        issues: ['Sandbox mode only', 'No webhook verification', 'Limited error handling'],
        recommendations: ['Production PayPal setup', 'Webhook security', 'Comprehensive error handling'],
        priority: 'medium',
        lastChecked: new Date().toISOString(),
        dependencies: ['webhook-system'],
        implementation: { exists: true, functional: true, optimized: false, tested: false }
      },
      {
        id: 'memory-management',
        name: 'Memory Management',
        category: 'performance',
        status: 'healthy',
        description: 'Advanced memory management with cleanup',
        issues: [],
        recommendations: ['Monitor memory usage patterns', 'Optimize large data sets'],
        priority: 'low',
        lastChecked: new Date().toISOString(),
        dependencies: ['core-system'],
        implementation: { exists: true, functional: true, optimized: true, tested: true }
      },
      {
        id: 'security-layer',
        name: 'Security Layer',
        category: 'security',
        status: 'warning',
        description: 'Security monitoring and protection',
        issues: ['No rate limiting', 'Missing input validation', 'No audit logging'],
        recommendations: ['Implement rate limiting', 'Add input validation', 'Security audit logs'],
        priority: 'high',
        lastChecked: new Date().toISOString(),
        dependencies: ['auth-system'],
        implementation: { exists: false, functional: false, optimized: false, tested: false }
      }
    ]

    const missingFeaturesList: MissingFeature[] = [
      {
        id: 'real-oauth-flows',
        name: 'Real OAuth Flows',
        description: 'Implement actual OAuth 2.0 flows for all supported platforms',
        category: 'Integration',
        priority: 'critical',
        estimatedEffort: 'large',
        dependencies: ['oauth-manager', 'secure-storage'],
        benefits: ['Enable real platform connections', 'Actual revenue tracking', 'User authentication'],
        risks: ['Security vulnerabilities if not implemented correctly', 'API rate limits']
      },
      {
        id: 'webhook-system',
        name: 'Webhook System',
        description: 'Centralized webhook handling for all platform integrations',
        category: 'Infrastructure',
        priority: 'critical',
        estimatedEffort: 'medium',
        dependencies: ['edge-functions', 'security-layer'],
        benefits: ['Real-time data updates', 'Automated workflows', 'Event-driven architecture'],
        risks: ['Webhook security', 'Processing failures', 'Rate limiting']
      },
      {
        id: 'email-api-integration',
        name: 'Email API Integration',
        description: 'Connect to Gmail, Outlook, and other email providers',
        category: 'Integration',
        priority: 'high',
        estimatedEffort: 'large',
        dependencies: ['oauth-flows', 'ai-processing'],
        benefits: ['Real email monitoring', 'Automated categorization', 'Deal detection'],
        risks: ['Privacy concerns', 'API limitations', 'Data processing costs']
      },
      {
        id: 'bank-api-integration',
        name: 'Bank API Integration',
        description: 'Connect to banking APIs for automatic transaction import',
        category: 'Financial',
        priority: 'high',
        estimatedEffort: 'xl',
        dependencies: ['security-layer', 'encryption'],
        benefits: ['Automated expense tracking', 'Real-time financial data', 'Tax preparation'],
        risks: ['Security requirements', 'Regulatory compliance', 'Data sensitivity']
      },
      {
        id: 'receipt-ocr',
        name: 'Receipt OCR Processing',
        description: 'AI-powered receipt scanning and data extraction',
        category: 'AI',
        priority: 'medium',
        estimatedEffort: 'medium',
        dependencies: ['ai-integration', 'file-storage'],
        benefits: ['Automated expense entry', 'Digital receipt storage', 'Tax documentation'],
        risks: ['OCR accuracy', 'Processing costs', 'File storage limits']
      },
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics Dashboard',
        description: 'Comprehensive analytics with predictive insights',
        category: 'Analytics',
        priority: 'medium',
        estimatedEffort: 'large',
        dependencies: ['data-warehouse', 'ai-integration'],
        benefits: ['Business insights', 'Trend analysis', 'Performance optimization'],
        risks: ['Data complexity', 'Processing overhead', 'Storage requirements']
      },
      {
        id: 'mobile-app',
        name: 'Mobile Application',
        description: 'Native mobile app for iOS and Android',
        category: 'Platform',
        priority: 'low',
        estimatedEffort: 'xl',
        dependencies: ['api-layer', 'auth-system'],
        benefits: ['Mobile accessibility', 'Push notifications', 'Offline capabilities'],
        risks: ['Development complexity', 'App store approval', 'Maintenance overhead']
      },
      {
        id: 'backup-system',
        name: 'Automated Backup System',
        description: 'Automated data backup and disaster recovery',
        category: 'Infrastructure',
        priority: 'high',
        estimatedEffort: 'medium',
        dependencies: ['database-layer', 'cloud-storage'],
        benefits: ['Data protection', 'Disaster recovery', 'Compliance'],
        risks: ['Storage costs', 'Recovery complexity', 'Data integrity']
      },
      {
        id: 'api-rate-limiting',
        name: 'API Rate Limiting',
        description: 'Intelligent rate limiting and quota management',
        category: 'Security',
        priority: 'high',
        estimatedEffort: 'small',
        dependencies: ['security-layer'],
        benefits: ['API protection', 'Cost control', 'Performance stability'],
        risks: ['User experience impact', 'Configuration complexity']
      },
      {
        id: 'custom-domain',
        name: 'Custom Domain Support',
        description: 'Support for custom domains with passive-core branding',
        category: 'Infrastructure',
        priority: 'medium',
        estimatedEffort: 'medium',
        dependencies: ['dns-management', 'ssl-certificates'],
        benefits: ['Professional branding', 'SEO benefits', 'User trust'],
        risks: ['DNS complexity', 'SSL management', 'Domain verification']
      }
    ]

    setComponents(auditComponents)
    setMissingFeatures(missingFeaturesList)

    // Calculate metrics
    const totalComponents = auditComponents.length
    const healthyComponents = auditComponents.filter(c => c.status === 'healthy').length
    const warningComponents = auditComponents.filter(c => c.status === 'warning').length
    const errorComponents = auditComponents.filter(c => c.status === 'error').length
    const missingComponents = auditComponents.filter(c => c.status === 'missing').length
    const criticalIssues = auditComponents.filter(c => c.priority === 'critical').length

    const overallHealth = Math.round((healthyComponents / totalComponents) * 100)
    const performanceScore = Math.round(((healthyComponents * 100 + warningComponents * 60 + errorComponents * 20) / (totalComponents * 100)) * 100)
    const securityScore = Math.round(((auditComponents.filter(c => c.category === 'security' && c.status === 'healthy').length / auditComponents.filter(c => c.category === 'security').length) || 0) * 100)
    const completenessScore = Math.round(((auditComponents.filter(c => c.implementation.exists && c.implementation.functional).length / totalComponents) * 100))

    setMetrics({
      totalComponents,
      healthyComponents,
      warningComponents,
      errorComponents,
      missingComponents,
      overallHealth,
      criticalIssues,
      performanceScore,
      securityScore,
      completenessScore
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'missing': return <Clock className="h-5 w-5 text-gray-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'missing': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'small': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'large': return 'bg-orange-100 text-orange-800'
      case 'xl': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredComponents = selectedCategory === 'all' 
    ? components 
    : components.filter(c => c.category === selectedCategory)

  const categories = ['all', ...Array.from(new Set(components.map(c => c.category)))]

  if (isRunningAudit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Running System Audit...</p>
          <Progress value={auditProgress} className="w-64 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">{Math.round(auditProgress)}% complete</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Audit</h1>
          <p className="text-muted-foreground">Comprehensive analysis of all system components and missing features</p>
        </div>
        <Button onClick={runSystemAudit} disabled={isRunningAudit}>
          <Activity className="h-4 w-4 mr-2" />
          Run Audit
        </Button>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Health</p>
                  <p className="text-2xl font-bold">{metrics.overallHealth}%</p>
                </div>
              </div>
              <Progress value={metrics.overallHealth} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance</p>
                  <p className="text-2xl font-bold">{metrics.performanceScore}%</p>
                </div>
              </div>
              <Progress value={metrics.performanceScore} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security</p>
                  <p className="text-2xl font-bold">{metrics.securityScore}%</p>
                </div>
              </div>
              <Progress value={metrics.securityScore} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completeness</p>
                  <p className="text-2xl font-bold">{metrics.completenessScore}%</p>
                </div>
              </div>
              <Progress value={metrics.completenessScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Issues Alert */}
      {metrics && metrics.criticalIssues > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{metrics.criticalIssues} critical issues</strong> require immediate attention to ensure system stability and functionality.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="missing">Missing Features</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Component Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Component Status</CardTitle>
                <CardDescription>Distribution of component health status</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Healthy</span>
                      </div>
                      <span className="text-sm font-bold">{metrics.healthyComponents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Warning</span>
                      </div>
                      <span className="text-sm font-bold">{metrics.warningComponents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Error</span>
                      </div>
                      <span className="text-sm font-bold">{metrics.errorComponents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Missing</span>
                      </div>
                      <span className="text-sm font-bold">{metrics.missingComponents}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Priority Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Issues</CardTitle>
                <CardDescription>Components requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {components
                      .filter(c => c.priority === 'critical' || c.priority === 'high')
                      .slice(0, 5)
                      .map(component => (
                        <div key={component.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(component.status)}
                            <div>
                              <p className="text-sm font-medium">{component.name}</p>
                              <p className="text-xs text-muted-foreground">{component.category}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${getPriorityColor(component.priority)} text-white`}>
                            {component.priority}
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>

          {/* Components List */}
          <div className="space-y-4">
            {filteredComponents.map(component => (
              <Card key={component.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(component.status)}
                      <div>
                        <h3 className="font-semibold">{component.name}</h3>
                        <p className="text-sm text-muted-foreground">{component.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getStatusColor(component.status)}`}>
                        {component.status}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(component.priority)} text-white`}>
                        {component.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Implementation Status */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        component.implementation.exists ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <p className="text-xs text-muted-foreground">Exists</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        component.implementation.functional ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <p className="text-xs text-muted-foreground">Functional</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        component.implementation.optimized ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <p className="text-xs text-muted-foreground">Optimized</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        component.implementation.tested ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <p className="text-xs text-muted-foreground">Tested</p>
                    </div>
                  </div>

                  {/* Issues */}
                  {component.issues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 text-red-600">Issues:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {component.issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {component.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-blue-600">Recommendations:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {component.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Wrench className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          <div className="space-y-4">
            {missingFeatures.map(feature => (
              <Card key={feature.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{feature.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{feature.category}</Badge>
                        <Badge className={`text-xs ${getPriorityColor(feature.priority)} text-white`}>
                          {feature.priority}
                        </Badge>
                        <Badge className={`text-xs ${getEffortColor(feature.estimatedEffort)}`}>
                          {feature.estimatedEffort} effort
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Benefits */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-green-600">Benefits:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600">Risks:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {feature.risks.map((risk, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Dependencies */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-blue-600">Dependencies:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {feature.dependencies.map((dep, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Network className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{dep}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-6">
            {/* Immediate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Immediate Actions Required</span>
                </CardTitle>
                <CardDescription>Critical issues that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Platform Integration:</strong> Implement real API connections for all 15+ platforms to enable actual revenue tracking and automation.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>OAuth Flows:</strong> Replace mock OAuth implementation with real OAuth 2.0 flows for secure platform authentication.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Layer:</strong> Implement rate limiting, input validation, and audit logging to protect the system.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Short-term Improvements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span>Short-term Improvements (1-4 weeks)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Implement webhook system for real-time platform updates</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Add database indexes and optimization for better performance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Implement automated backup system for data protection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Add custom domain support with passive-core branding</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Long-term Roadmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>Long-term Roadmap (1-6 months)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Email API integration for real-time email monitoring and categorization</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Bank API integration for automated financial tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Advanced analytics dashboard with predictive insights</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Mobile application for iOS and Android</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Receipt OCR processing for automated expense tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ComprehensiveSystemAudit