'use client'

import { useState } from 'react'
import type { Phase } from '@/types'
import { useAppStore } from '@/store/appStore'

interface Props {
  projectId: string
  currentPhase: Phase
  prefill?: { title?: string; reason?: string; contextSnippet?: string }
  onClose: () => void
}

export function TicketCreateForm({ projectId, currentPhase, prefill, onClose }: Props) {
  const { addTicket, roles } = useAppStore()
  const [title, setTitle] = useState(prefill?.title ?? '')
  const [reason, setReason] = useState(prefill?.reason ?? '')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    await addTicket(projectId, {
      projectId,
      title: title.trim(),
      reason: reason.trim(),
      phase: currentPhase,
      assignedTo,
      status: 'todo',
      createdBy: 'user',
      contextSnippet: prefill?.contextSnippet ?? '',
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ticket 標題..."
        className="w-full bg-transparent border border-zinc-700 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#7c6dfa]"
      />
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="為什麼需要這個 ticket？"
        rows={2}
        className="w-full bg-transparent border border-zinc-700 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#7c6dfa] resize-none"
      />
      <div className="flex gap-2 flex-wrap">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setAssignedTo(assignedTo === role.id ? null : role.id)}
            className="px-2.5 py-1 rounded text-xs font-mono transition-colors"
            style={
              assignedTo === role.id
                ? { backgroundColor: role.color, color: '#fff' }
                : { border: `1px solid ${role.color}40`, color: role.color }
            }
          >
            {role.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="px-3 py-1.5 text-xs font-mono bg-[#7c6dfa] hover:bg-[#6c5df0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          建立
        </button>
      </div>
    </form>
  )
}
