'use client'

import { useState } from 'react'
import type { Ticket, Phase } from '@/types'
import { useAppStore } from '@/store/appStore'
import { TicketWorkLog } from '@/components/tickets/TicketWorkLog'

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

const PHASE_COLORS: Record<Phase, string> = {
  research: '#60a5fa',
  plan: '#a78bfa',
  execute: '#4ade80',
  review: '#fbbf24',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-zinc-500',
}

interface Props {
  ticket: Ticket
  projectId: string
  projectName: string
}

export function RoleTicketCard({ ticket, projectId, projectName }: Props) {
  const { updateTicketStatus, updateTicket, deleteTicket } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [title, setTitle] = useState(ticket.title)
  const [reason, setReason] = useState(ticket.reason)

  function handleSave() {
    updateTicket(projectId, {
      ...ticket,
      title: title.trim() || ticket.title,
      reason: reason.trim(),
    })
    setEditing(false)
  }

  function handleCancel() {
    setTitle(ticket.title)
    setReason(ticket.reason)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-3 rounded-lg border border-[#7c6dfa]/50 bg-zinc-900">
        <input
          className="w-full bg-zinc-800 text-zinc-100 text-sm font-mono rounded px-2 py-1.5 mb-2 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <input
          className="w-full bg-zinc-800 text-zinc-400 text-xs font-mono rounded px-2 py-1.5 mb-3 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="原因"
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 text-xs font-mono py-1 rounded bg-[#7c6dfa] text-white hover:bg-[#6d5ee8] transition-colors">儲存</button>
          <button onClick={handleCancel} className="flex-1 text-xs font-mono py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">取消</button>
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
          <button onClick={() => setEditing(true)} className="text-zinc-600 hover:text-[#7c6dfa] text-xs" title="編輯">✎</button>
          <button onClick={() => deleteTicket(projectId, ticket.id)} className="text-zinc-600 hover:text-red-400 text-xs" title="刪除">✕</button>
        </div>
      </div>

      {ticket.reason && (
        <p className="text-xs text-zinc-500 mt-1 leading-snug line-clamp-2">{ticket.reason}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{ color: PHASE_COLORS[ticket.phase], backgroundColor: `${PHASE_COLORS[ticket.phase]}18` }}
        >
          {ticket.phase}
        </span>
        <span className="text-xs font-mono text-zinc-600">{projectName}</span>
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

      <button
        onClick={() => setShowLog((v) => !v)}
        className="mt-2 text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        {showLog ? '▲' : '▼'} 進度記錄
        {(ticket.workLogs?.length ?? 0) > 0 && (
          <span className="ml-1 text-zinc-500">({ticket.workLogs!.length})</span>
        )}
      </button>

      {showLog && <TicketWorkLog ticket={ticket} projectId={projectId} />}
    </div>
  )
}
