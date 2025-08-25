import React, { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Skeleton } from '../ui/skeleton'

interface Props {
  onNewProject?: () => void
}

export default function DashboardLayout({ onNewProject }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="hidden lg:flex h-screen">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNewProject={onNewProject} />
        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Skeleton className="h-32 w-full" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
