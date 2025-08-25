import { Button } from '../ui/Button'
import { Plus, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
  onNewProject?: () => void
}

export function Header({ onMenuClick, onNewProject }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMenuClick && (
            <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Project Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your AI-powered projects</p>
          </div>
        </div>
        
        <Button onClick={onNewProject} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>
    </header>
  )
}
