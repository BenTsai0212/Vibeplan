'use client'

import { useState } from 'react'
import type { Phase } from '@/types'
import { useAppStore } from '@/store/appStore'
import { TicketCard } from './TicketCard'
import { TicketCreateForm } from './TicketCreateForm'
import { PMButton } from '@/components/pm/PMButton'

const PHASE_COLORS: Record<Phase, string> = {
  research: '#60a5fa',
  plan: '#a78bfa',
  execute: '#4ade80',
  review: '#fbbf24',
}

export function TicketPanel() {
  const activeProject = useAppStore((s) => s.activeProject())
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')

  if (!activeProject) {
    return (
      <aside className="flex flex-col h-full border-l border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 font-mono">選擇一個專案</p>
      </aside>
    )
  }

  const tickets = activeProject.tickets.filter(
    (t) => filter === 'all' || t.status === filter
  )

  const currentPhase = activeProject.currentPhase
  const phaseColor = PHASE_COLORS[currentPhase]

  return (
    <aside className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950">
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">Tickets</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-mono px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
          >
            {showForm ? '取消' : '+ 新增'}
          </button>
        </div>

        <PMButton projectId={activeProject.id} currentPhase={currentPhase} />
      </div>

      {showForm && (
        <div className="px-3 pt-3">
          <TicketCreateForm
            projectId={activeProject.id}
            currentPhase={currentPhase}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="flex gap-1 px-3 pt-2 pb-1">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
              filter === s ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-zinc-600">{tickets.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {tickets.length === 0 ? (
          <p className="text-xs text-zinc-700 font-mono text-center pt-8">
            {filter === 'all' ? '還沒有 tickets' : `沒有 ${filter} 的 tickets`}
          </p>
        ) : (
          tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} projectId={activeProject.id} />
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-zinc-800">
        <div className="flex gap-3 text-xs font-mono text-zinc-600">
          <span style={{ color: phaseColor }} className="opacity-70">◆ {currentPhase}</span>
          <span>{activeProject.tickets.filter((t) => t.status !== 'done').length} 待完成</span>
        </div>
      </div>
    </aside>
  )
}
