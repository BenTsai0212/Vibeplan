'use client'

import type { Phase } from '@/types'
import { useAppStore } from '@/store/appStore'

const PHASES: Phase[] = ['research', 'plan', 'execute', 'review']

const PHASE_COLORS: Record<Phase, string> = {
  research: '#60a5fa',
  plan: '#a78bfa',
  execute: '#4ade80',
  review: '#fbbf24',
}

const PHASE_LABELS: Record<Phase, string> = {
  research: 'Research',
  plan: 'Plan',
  execute: 'Execute',
  review: 'Review',
}

interface Props {
  showDocs: boolean
  onDocsToggle: () => void
}

export function PhaseTabBar({ showDocs, onDocsToggle }: Props) {
  const activeProject = useAppStore((s) => s.activeProject())
  const setCurrentPhase = useAppStore((s) => s.setCurrentPhase)

  if (!activeProject) return null

  return (
    <div className="flex border-b border-zinc-800 px-4">
      {PHASES.map((phase) => {
        const isActive = !showDocs && activeProject.currentPhase === phase
        const color = PHASE_COLORS[phase]
        return (
          <button
            key={phase}
            onClick={() => { setCurrentPhase(phase); if (showDocs) onDocsToggle() }}
            className={`px-4 py-3 text-xs font-mono transition-colors relative ${
              isActive ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {PHASE_LABELS[phase]}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
        )
      })}

      {/* Docs tab */}
      <button
        onClick={onDocsToggle}
        className={`ml-auto px-4 py-3 text-xs font-mono transition-colors relative ${
          showDocs ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
        }`}
      >
        Docs
        {showDocs && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#7c6dfa]" />
        )}
      </button>
    </div>
  )
}
