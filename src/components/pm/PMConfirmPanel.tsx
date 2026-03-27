'use client'

import { useState } from 'react'
import type { PMProposedTicket, Phase } from '@/types'
import { AgentBadge } from '@/components/tickets/AgentBadge'
import { useAppStore } from '@/store/appStore'

interface Props {
  projectId: string
  currentPhase: Phase
  thinking: string
  proposed: PMProposedTicket[]
  onClose: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-zinc-500',
}

export function PMConfirmPanel({ projectId, currentPhase, thinking, proposed, onClose }: Props) {
  const { addTicket, roles } = useAppStore()
  const [selected, setSelected] = useState<Set<number>>(new Set(proposed.map((_, i) => i)))
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function toggleExpand(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function resolveRoleId(assignTo: string): string | null {
    const match = roles.find(
      (r) => r.name === assignTo || r.name.toLowerCase() === assignTo.toLowerCase()
    )
    return match?.id ?? null
  }

  async function handleConfirm() {
    setSubmitting(true)
    for (const i of selected) {
      const t = proposed[i]
      await addTicket(projectId, {
        projectId,
        title: t.title,
        reason: t.reason,
        acceptanceCriteria: t.acceptanceCriteria,
        phase: currentPhase,
        assignedTo: resolveRoleId(t.assignTo),
        status: 'todo',
        createdBy: 'pm',
        contextSnippet: t.contextSnippet ?? '',
        priority: t.priority,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            <span className="text-sm font-mono font-medium text-zinc-200">PM 分析結果</span>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 min-h-0">
          {/* PM thinking */}
          <div className="bg-zinc-900 rounded-lg p-3 border-l-2 border-[#a78bfa]">
            <p className="text-xs text-zinc-500 mb-1 font-mono">PM 的分析思路</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{thinking}</p>
          </div>

          {/* Proposed tickets */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-mono">提議的 Tickets（勾選要建立的）</p>
            {proposed.map((t, i) => {
              const roleId = resolveRoleId(t.assignTo)
              const isExpanded = expanded.has(i)
              const hasDetails = !!(t.acceptanceCriteria || t.contextSnippet)
              return (
                <div
                  key={i}
                  className={`rounded-lg border transition-colors ${
                    selected.has(i) ? 'border-[#7c6dfa] bg-[#7c6dfa0d]' : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  {/* Header row */}
                  <label className="flex items-start gap-3 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-0.5 accent-[#7c6dfa] shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-mono text-zinc-100">{t.title}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{t.reason}</p>
                      <div className="flex gap-2 items-center flex-wrap">
                        {roleId ? (
                          <AgentBadge agentId={roleId} />
                        ) : (
                          <span className="text-xs font-mono text-zinc-600">{t.assignTo}</span>
                        )}
                        <span className={`text-xs font-mono ${PRIORITY_COLORS[t.priority] ?? 'text-zinc-500'}`}>
                          {t.priority}
                        </span>
                        {hasDetails && (
                          <button
                            onClick={() => toggleExpand(i)}
                            className="ml-auto text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
                          >
                            {isExpanded ? '▲ 收起' : '▼ 詳情'}
                          </button>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <div className="px-4 pb-3 space-y-2 border-t border-zinc-800/60 pt-2">
                      {t.acceptanceCriteria && (
                        <div>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">完成定義</p>
                          <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                            {t.acceptanceCriteria}
                          </div>
                        </div>
                      )}
                      {t.contextSnippet && (
                        <div>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">來源對話</p>
                          <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-700 pl-2">
                            {t.contextSnippet}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex justify-between items-center shrink-0">
          <span className="text-xs text-zinc-500 font-mono">已選 {selected.size} / {proposed.length} 張</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0 || submitting}
              className="px-4 py-2 text-sm font-mono bg-[#7c6dfa] hover:bg-[#6c5df0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {submitting ? '建立中...' : `確認建立 ${selected.size} 張`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
