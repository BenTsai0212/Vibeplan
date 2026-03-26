'use client'

import { useState } from 'react'
import type { Ticket } from '@/types'
import { AgentBadge } from './AgentBadge'
import { useAppStore } from '@/store/appStore'

const STATUS_CYCLE: Record<Ticket['status'], Ticket['status']> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_COLORS: Record<Ticket['status'], string> = {
  todo: 'text-zinc-400',
  in_progress: 'text-[#fbbf24]',
  done: 'text-[#4ade80]',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-zinc-500',
}

export function TicketCard({ ticket, projectId }: { ticket: Ticket; projectId: string }) {
  const { updateTicketStatus, updateTicket, deleteTicket, roles } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(ticket.title)
  const [reason, setReason] = useState(ticket.reason)
  const [assignedTo, setAssignedTo] = useState<string>(ticket.assignedTo ?? '')
  const [priority, setPriority] = useState<Ticket['priority'] | ''>(ticket.priority ?? '')

  function handleSave() {
    updateTicket(projectId, {
      ...ticket,
      title: title.trim() || ticket.title,
      reason: reason.trim(),
      assignedTo: assignedTo || null,
      priority: priority || undefined,
    })
    setEditing(false)
  }

  function handleCancel() {
    setTitle(ticket.title)
    setReason(ticket.reason)
    setAssignedTo(ticket.assignedTo ?? '')
    setPriority(ticket.priority ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-3 rounded-lg border border-[#7c6dfa]/50 bg-zinc-900">
        <input
          className="w-full bg-zinc-800 text-zinc-100 text-sm font-mono rounded px-2 py-1.5 mb-2 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ticket 標題"
          autoFocus
        />
        <input
          className="w-full bg-zinc-800 text-zinc-400 text-xs font-mono rounded px-2 py-1.5 mb-2 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="原因（一句話）"
        />
        <div className="flex gap-2 mb-3">
          <select
            className="flex-1 bg-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">未指派</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            className="flex-1 bg-zinc-800 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Ticket['priority'] | '')}
          >
            <option value="">Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 text-xs font-mono py-1 rounded bg-[#7c6dfa] text-white hover:bg-[#6d5ee8] transition-colors"
          >
            儲存
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 text-xs font-mono py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group p-3 rounded-lg border border-zinc-800 bg-zinc-900 transition-opacity ${ticket.status === 'done' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-sm font-mono leading-snug flex-1 cursor-pointer hover:text-[#7c6dfa] transition-colors ${ticket.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}
          onClick={() => setEditing(true)}
        >
          {ticket.title}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-zinc-600 hover:text-[#7c6dfa] text-xs"
            title="編輯"
          >
            ✎
          </button>
          <button
            onClick={() => deleteTicket(projectId, ticket.id)}
            className="text-zinc-600 hover:text-red-400 text-xs"
            title="刪除"
          >
            ✕
          </button>
        </div>
      </div>

      {ticket.reason && (
        <p className="text-xs text-zinc-500 mt-1 leading-snug line-clamp-2">{ticket.reason}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {ticket.assignedTo && <AgentBadge agentId={ticket.assignedTo} />}
        {ticket.priority && (
          <span className={`text-xs font-mono ${PRIORITY_COLORS[ticket.priority] ?? 'text-zinc-500'}`}>
            {ticket.priority}
          </span>
        )}
        <button
          onClick={() => updateTicketStatus(projectId, ticket.id, STATUS_CYCLE[ticket.status])}
          className={`ml-auto text-xs font-mono ${STATUS_COLORS[ticket.status]} hover:opacity-80 transition-opacity`}
        >
          {STATUS_LABELS[ticket.status]}
        </button>
      </div>

      {ticket.contextSnippet && (
        <p className="text-xs text-zinc-600 mt-2 border-l-2 border-zinc-700 pl-2 line-clamp-2 italic">
          {ticket.contextSnippet}
        </p>
      )}
    </div>
  )
}
