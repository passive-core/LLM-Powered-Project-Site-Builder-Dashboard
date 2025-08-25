import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { useTheme } from '../../hooks/useTheme'
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Zap,
  Palette,
  Share2,
  Map,
  Activity,
  Shield,
  Smartphone,
  CreditCard,
  CheckSquare,
  MemoryStick,
  Brain,
  Key,
  Globe,
  DollarSign,
  Mail,
  Users,
  Sparkles,
  Server
} from 'lucide-react'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'AI Builder', icon: Sparkles, href: '/builder' },
  { name: 'Domains', icon: Globe, href: '/domains' },
  { name: 'Platforms & Tools', icon: Server, href: '/platforms' },
  { name: 'Activity Tracker', icon: Activity, href: '/activity' },
  { name: 'LLM Memory', icon: Brain, href: '/llm-memory' },
  { name: 'Chat Assistant', icon: MessageSquare, href: '/chat' },
  { name: 'AI Assistant', icon: Brain, href: '/ai-assistant' },
  { name: 'OAuth Manager', icon: Users, href: '/oauth-manager' },
  { name: 'Platform Integration', icon: Globe, href: '/platform-integration' },
  { name: 'Financial Tracking', icon: DollarSign, href: '/financial-tracking' },
  { name: 'Email Tracker', icon: Mail, href: '/email-tracker' },
  { name: 'PayPal Integration', icon: CreditCard, href: '/paypal-integration' },
  { name: 'Todo System', icon: CheckSquare, href: '/todos' },
  { name: 'Memory Management', icon: MemoryStick, href: '/memory' },
  { name: 'Design Studio', icon: Palette, href: '/design' },
  { name: 'Social Integration', icon: Share2, href: '/social' },
  { name: 'Roadmap', icon: Map, href: '/roadmap' },
  { name: 'Health Check', icon: Activity, href: '/health' },
  { name: 'Admin Panel', icon: Settings, href: '/admin' },
  { name: 'Security', icon: Shield, href: '/security' },
  { name: 'Mobile App', icon: Smartphone, href: '/mobile' },
]

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <div className={cn(
      'bg-card border-r border-border flex flex-col h-full transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="border-b border-border flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">LLM Builder</span>
            </div>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn('p-2', isCollapsed && 'mx-auto')}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    'w-full justify-start h-10',
                    isCollapsed ? 'px-2' : 'px-3'
                  )}
                >
                  <Icon className={cn('w-5 h-5', !isCollapsed && 'mr-3')} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border flex-shrink-0 p-4">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className={cn(
            'w-full justify-start h-10',
            isCollapsed ? 'px-2' : 'px-3'
          )}
        >
          {theme === 'dark' ? (
            <Sun className={cn('w-5 h-5', !isCollapsed && 'mr-3')} />
          ) : (
            <Moon className={cn('w-5 h-5', !isCollapsed && 'mr-3')} />
          )}
          {!isCollapsed && <span>Toggle Theme</span>}
        </Button>
      </div>
    </div>
  )
}