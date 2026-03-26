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

export function PMConfirmPanel({ projectId, currentPhase, thinking, proposed, onClose }: Props) {
  const { addTicket, roles } = useAppStore()
  const [selected, setSelected] = useState<Set<number>>(new Set(proposed.map((_, i) => i)))
  const [submitting, setSubmitting] = useState(false)

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  // Match PM's role name string back to a Role.id
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
        phase: currentPhase,
        assignedTo: resolveRoleId(t.assignTo),
        status: 'todo',
        createdBy: 'pm',
        contextSnippet: '',
        priority: t.priority,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            <span className="text-sm font-mono font-medium text-zinc-200">PM 分析結果</span>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="bg-zinc-900 rounded-lg p-3 border-l-2 border-[#a78bfa]">
            <p className="text-xs text-zinc-500 mb-1 font-mono">PM 的分析思路</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{thinking}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-mono">提議的 Tickets（勾選要建立的）</p>
            {proposed.map((t, i) => {
              const roleId = resolveRoleId(t.assignTo)
              return (
                <label
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.has(i)
                      ? 'border-[#7c6dfa] bg-[#7c6dfa0d]'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-0.5 accent-[#7c6dfa]"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-mono text-zinc-100">{t.title}</p>
                    <p className="text-xs text-zinc-500">{t.reason}</p>
                    <div className="flex gap-2 items-center">
                      {roleId ? (
                        <AgentBadge agentId={roleId} />
                      ) : (
                        <span className="text-xs font-mono text-zinc-600">{t.assignTo}</span>
                      )}
                      <span className={`text-xs font-mono ${
                        t.priority === 'high' ? 'text-red-400' : t.priority === 'medium' ? 'text-yellow-400' : 'text-zinc-500'
                      }`}>{t.priority}</span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex justify-between items-center">
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
