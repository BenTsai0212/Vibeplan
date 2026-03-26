'use client'

import { useState } from 'react'
import type { Phase, Ticket } from '@/types'
import { useAppStore } from '@/store/appStore'
import { TicketCard } from './TicketCard'
import { TicketCreateForm } from './TicketCreateForm'
import { PMButton } from '@/components/pm/PMButton'

const PHASES: Phase[] = ['research', 'plan', 'execute', 'review']

const PHASE_LABELS: Record<Phase, string> = {
  research: 'Research',
  plan: 'Plan',
  execute: 'Execute',
  review: 'Review',
}

const PHASE_COLORS: Record<Phase, string> = {
  research: '#60a5fa',
  plan: '#a78bfa',
  execute: '#4ade80',
  review: '#fbbf24',
}

function PhaseGroup({
  phase,
  tickets,
  projectId,
}: {
  phase: Phase
  tickets: Ticket[]
  projectId: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const color = PHASE_COLORS[phase]
  const doneCount = tickets.filter((t) => t.status === 'done').length

  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 px-1 py-1.5 text-xs font-mono hover:bg-zinc-800/50 rounded transition-colors"
      >
        <span style={{ color }} className="text-[10px]">{collapsed ? '▶' : '▼'}</span>
        <span style={{ color }} className="font-medium uppercase tracking-wider">
          {PHASE_LABELS[phase]}
        </span>
        <span className="ml-auto text-zinc-600">
          {doneCount}/{tickets.length}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2 mt-1">
          {tickets.length === 0 ? (
            <p className="text-xs text-zinc-700 font-mono px-1 pb-2">— 無 tickets</p>
          ) : (
            tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} projectId={projectId} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function TicketPanel() {
  const activeProject = useAppStore((s) => s.activeProject())
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')

  if (!activeProject) {
    return (
      <aside className="flex flex-col h-full border-l border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 font-mono">選擇一個專案</p>
      </aside>
    )
  }

  const currentPhase = activeProject.currentPhase
  const phaseColor = PHASE_COLORS[currentPhase]

  const filteredTickets = activeProject.tickets.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter
  )

  const ticketsByPhase = PHASES.reduce<Record<Phase, Ticket[]>>(
    (acc, phase) => {
      acc[phase] = filteredTickets.filter((t) => t.phase === phase)
      return acc
    },
    { research: [], plan: [], execute: [], review: [] }
  )

  const totalPending = activeProject.tickets.filter((t) => t.status !== 'done').length

  return (
    <aside className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
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

      {/* Create form */}
      {showForm && (
        <div className="px-3 pt-3 border-b border-zinc-800 pb-3">
          <TicketCreateForm
            projectId={activeProject.id}
            currentPhase={currentPhase}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1 px-3 pt-2 pb-1 border-b border-zinc-800/50">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
              statusFilter === s ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'WIP' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-zinc-600">{filteredTickets.length}</span>
      </div>

      {/* Phase groups */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {filteredTickets.length === 0 && statusFilter === 'all' ? (
          <p className="text-xs text-zinc-700 font-mono text-center pt-8">還沒有 tickets</p>
        ) : (
          PHASES.map((phase) => (
            <PhaseGroup
              key={phase}
              phase={phase}
              tickets={ticketsByPhase[phase]}
              projectId={activeProject.id}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-800">
        <div className="flex gap-3 text-xs font-mono text-zinc-600">
          <span style={{ color: phaseColor }} className="opacity-70">◆ {currentPhase}</span>
          <span>{totalPending} 待完成</span>
        </div>
      </div>
    </aside>
  )
}
