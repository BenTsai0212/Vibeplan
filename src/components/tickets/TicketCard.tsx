'use client'

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
  const { updateTicketStatus, deleteTicket } = useAppStore()

  return (
    <div className={`group p-3 rounded-lg border border-zinc-800 bg-zinc-900 transition-opacity ${ticket.status === 'done' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-mono leading-snug flex-1 ${ticket.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
          {ticket.title}
        </p>
        <button
          onClick={() => deleteTicket(projectId, ticket.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 text-xs shrink-0"
          title="Delete ticket"
        >
          ✕
        </button>
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
