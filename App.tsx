import { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Skeleton } from './components/ui/skeleton'
import { ComprehensiveHomeDashboard } from './components/ComprehensiveHomeDashboard'
import { Dashboard } from './components/Dashboard'
import { ChatAssistant } from './components/ChatAssistant'
import { RoadmapManager } from './components/RoadmapManager'
import { HealthCheck } from './components/HealthCheck'
import { ServiceAdminPanel } from './components/ServiceAdminPanel'
import { SecuritySettings } from './components/SecuritySettings'
import { MobileAppInfo } from './components/MobileAppInfo'
import { LLMGuidanceSystem } from './components/LLMGuidanceSystem'
import blink from './blink/client'

// Lazy load heavy components to optimize build performance
const LLMProjectBuilder = lazy(() => import('./components/LLMProjectBuilder'))
const DomainManager = lazy(() => import('./components/DomainManager'))
const PlatformsManager = lazy(() => import('./components/PlatformsManager'))
const ActivityTracker = lazy(() => import('./components/ActivityTracker'))
const LLMMemorySystem = lazy(() => import('./components/LLMMemorySystem'))
const DesignStudio = lazy(() => import('./components/DesignStudio'))
const MediaEditor = lazy(() => import('./components/MediaEditor'))
const SocialIntegration = lazy(() => import('./components/SocialIntegration'))
const PayPalIntegration = lazy(() => import('./components/PayPalIntegration'))
const ComprehensiveTodoSystem = lazy(() => import('./components/ComprehensiveTodoSystem'))
const MemoryManagementSystem = lazy(() => import('./components/MemoryManagementSystem'))
const AutonomousAIAssistant = lazy(() => import('./components/AutonomousAIAssistant'))
const ComprehensiveOAuthManager = lazy(() => import('./components/ComprehensiveOAuthManager'))
const ComprehensivePlatformIntegration = lazy(() => import('./components/ComprehensivePlatformIntegration'))
const FinancialTrackingSystem = lazy(() => import('./components/FinancialTrackingSystem'))
const EmailTrackerSystem = lazy(() => import('./components/EmailTrackerSystem'))
const PayPalBuildIntegration = lazy(() => import('./components/PayPalBuildIntegration'))
const ComprehensiveSystemAudit = lazy(() => import('./components/ComprehensiveSystemAudit'))
const AdvancedTrackingSystem = lazy(() => import('./components/AdvancedTrackingSystem'))
const AutonomousOperationSystem = lazy(() => import('./components/AutonomousOperationSystem'))
const BetsPage = lazy(() => import('./components/BetsPage'))
const DesignStudioLazy = lazy(() => import('./components/DesignStudio'))

// Dashboard layout
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))

function MediaEditorWrapper() {
  // MediaEditor expects a projectId param - handled by route
  return null
}

function AppContent() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [blink])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">LLM Project Builder</h1>
          <p className="text-muted-foreground mb-6">
            Create, manage, and maintain multiple web projects with the power of AI
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><Skeleton className="h-32 w-full" /></div>}>
        <Routes>
          <Route path="/" element={<ComprehensiveHomeDashboard />} />

          <Route path="/dashboard" element={<DashboardLayout onNewProject={() => console.log('new project')} />}> 
            <Route index element={<Dashboard />} />
            <Route path="builder" element={<LLMProjectBuilder />} />
            <Route path="domains" element={<DomainManager />} />
            <Route path="platforms" element={<PlatformsManager />} />
            <Route path="activity" element={<ActivityTracker />} />
            <Route path="llm-memory" element={<LLMMemorySystem />} />
            <Route path="chat" element={<ChatAssistant />} />
            <Route path="paypal" element={<PayPalIntegration />} />
            <Route path="todos" element={<ComprehensiveTodoSystem />} />
            <Route path="memory" element={<MemoryManagementSystem />} />
            <Route path="ai-assistant" element={<AutonomousAIAssistant />} />
            <Route path="oauth-manager" element={<ComprehensiveOAuthManager />} />
            <Route path="platform-integration" element={<ComprehensivePlatformIntegration />} />
            <Route path="financial-tracking" element={<FinancialTrackingSystem />} />
            <Route path="email-tracker" element={<EmailTrackerSystem />} />
            <Route path="paypal-integration" element={<PayPalBuildIntegration />} />
            <Route path="system-audit" element={<ComprehensiveSystemAudit />} />
            <Route path="advanced-tracking" element={<AdvancedTrackingSystem />} />
            <Route path="autonomous-operation" element={<AutonomousOperationSystem />} />
            <Route path="design" element={<DesignStudio />} />
            <Route path="social" element={<SocialIntegration />} />
            <Route path="roadmap" element={<RoadmapManager />} />
            <Route path="health" element={<HealthCheck />} />
            <Route path="admin" element={<ServiceAdminPanel />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="mobile" element={<MobileAppInfo />} />
            <Route path="bets" element={<BetsPage />} />
            <Route path="media-editor/:projectId" element={<MediaEditor />} />
          </Route>

          {/* Redirect top-level module routes to dashboard equivalents (keeps single source of truth) */}
          <Route path="/builder" element={<Navigate to="/dashboard/builder" replace />} />
          <Route path="/domains" element={<Navigate to="/dashboard/domains" replace />} />
          <Route path="/platforms" element={<Navigate to="/dashboard/platforms" replace />} />
          <Route path="/activity" element={<Navigate to="/dashboard/activity" replace />} />
          <Route path="/llm-memory" element={<Navigate to="/dashboard/llm-memory" replace />} />
          <Route path="/chat" element={<Navigate to="/dashboard/chat" replace />} />
          <Route path="/paypal" element={<Navigate to="/dashboard/paypal" replace />} />
          <Route path="/todos" element={<Navigate to="/dashboard/todos" replace />} />
          <Route path="/memory" element={<Navigate to="/dashboard/memory" replace />} />
          <Route path="/ai-assistant" element={<Navigate to="/dashboard/ai-assistant" replace />} />
          <Route path="/oauth-manager" element={<Navigate to="/dashboard/oauth-manager" replace />} />
          <Route path="/platform-integration" element={<Navigate to="/dashboard/platform-integration" replace />} />
          <Route path="/financial-tracking" element={<Navigate to="/dashboard/financial-tracking" replace />} />
          <Route path="/email-tracker" element={<Navigate to="/dashboard/email-tracker" replace />} />
          <Route path="/paypal-integration" element={<Navigate to="/dashboard/paypal-integration" replace />} />
          <Route path="/system-audit" element={<Navigate to="/dashboard/system-audit" replace />} />
          <Route path="/advanced-tracking" element={<Navigate to="/dashboard/advanced-tracking" replace />} />
          <Route path="/autonomous-operation" element={<Navigate to="/dashboard/autonomous-operation" replace />} />
          <Route path="/design" element={<Navigate to="/dashboard/design" replace />} />
          <Route path="/social" element={<Navigate to="/dashboard/social" replace />} />
          <Route path="/roadmap" element={<Navigate to="/dashboard/roadmap" replace />} />
          <Route path="/health" element={<Navigate to="/dashboard/health" replace />} />
          <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="/security" element={<Navigate to="/dashboard/security" replace />} />
          <Route path="/mobile" element={<Navigate to="/dashboard/mobile" replace />} />
          <Route path="/bets" element={<Navigate to="/dashboard/bets" replace />} />
          <Route path="/media-editor/:projectId" element={<Navigate to="/dashboard/media-editor/:projectId" replace />} />
        </Routes>
      </Suspense>

      {/* LLM Guidance System - Only show when user is authenticated */}
      {user && <LLMGuidanceSystem />}

      <Toaster position="top-right" />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
