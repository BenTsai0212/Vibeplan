'use client'

import { useState } from 'react'
import type { Message, Phase } from '@/types'
import { useAppStore } from '@/store/appStore'
import { TicketCreateForm } from '@/components/tickets/TicketCreateForm'

interface Props {
  message: Message
  projectId: string
  phase: Phase
}

export function MessageActions({ message, projectId, phase }: Props) {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div className="mt-2">
        <TicketCreateForm
          projectId={projectId}
          currentPhase={phase}
          prefill={{
            title: '',
            reason: '',
            contextSnippet: message.content.slice(0, 200),
          }}
          onClose={() => setShowForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => setShowForm(true)}
        className="text-xs font-mono text-zinc-600 hover:text-[#7c6dfa] transition-colors"
      >
        → Ticket
      </button>
    </div>
  )
}
