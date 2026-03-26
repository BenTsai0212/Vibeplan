'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { Sidebar } from './Sidebar'
import { PhaseTabBar } from '@/components/project/PhaseTabBar'
import { ConversationPanel } from '@/components/conversation/ConversationPanel'
import { TicketPanel } from '@/components/tickets/TicketPanel'

export function AppShell() {
  const { init, mounted, activeProject } = useAppStore()

  useEffect(() => {
    init()
  }, [init])

  if (!mounted) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs font-mono text-zinc-600 animate-pulse">Loading...</span>
      </div>
    )
  }

  const project = activeProject()

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 grid grid-cols-[220px_1fr_300px] overflow-hidden">
      <Sidebar />

      <main className="flex flex-col min-w-0 border-r border-zinc-800">
        {project ? (
          <>
            <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-3">
              <h1 className="text-sm font-mono font-medium text-zinc-200 truncate">{project.name}</h1>
            </div>
            <PhaseTabBar />
            <div className="flex-1 min-h-0">
              <ConversationPanel
                key={`${project.id}-${project.currentPhase}`}
                projectId={project.id}
                phase={project.currentPhase}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center space-y-2">
              <p className="text-2xl font-serif text-zinc-400">Vibe Planner</p>
              <p className="text-xs font-mono text-zinc-600">選擇左側專案，或建立一個新的</p>
            </div>
          </div>
        )}
      </main>

      <TicketPanel />
    </div>
  )
}
