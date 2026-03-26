'use client'

import type { Project } from '@/types'
import { useAppStore } from '@/store/appStore'

const PHASE_COLORS = {
  research: '#60a5fa',
  plan: '#a78bfa',
  execute: '#4ade80',
  review: '#fbbf24',
} as const

export function ProjectCard({ project, isActive }: { project: Project; isActive: boolean }) {
  const { setActiveProject, deleteProject } = useAppStore()
  const pendingTickets = project.tickets.filter((t) => t.status !== 'done').length
  const phaseColor = PHASE_COLORS[project.currentPhase]

  return (
    <div
      className={`group p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-900 border border-transparent'
      }`}
      onClick={() => setActiveProject(project.id)}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={`text-sm font-mono leading-snug flex-1 truncate ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>
          {project.name}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 text-xs shrink-0"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs font-mono" style={{ color: phaseColor }}>
          {project.currentPhase}
        </span>
        {pendingTickets > 0 && (
          <span className="text-xs font-mono text-zinc-600">
            {pendingTickets} tickets
          </span>
        )}
      </div>
    </div>
  )
}
