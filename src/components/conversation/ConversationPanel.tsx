'use client'

import { useEffect, useRef } from 'react'
import type { Phase } from '@/types'
import { useAppStore } from '@/store/appStore'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { PHASE_PROMPTS, PHASE_DESCRIPTIONS } from '@/lib/agents/prompts'

const PHASE_COLORS: Record<Phase, string> = {
  research: '#60a5fa',
  plan: '#a78bfa',
  execute: '#4ade80',
  review: '#fbbf24',
}

interface Props {
  projectId: string
  phase: Phase
}

export function ConversationPanel({ projectId, phase }: Props) {
  const { addMessage, projects } = useAppStore()
  const project = projects.find((p) => p.id === projectId)
  const conversation = project?.conversations.find((c) => c.phase === phase)
  const messages = conversation?.messages ?? []
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(content: string, role: 'user' | 'assistant') {
    await addMessage(projectId, phase, role, content)
  }

  const phaseColor = PHASE_COLORS[phase]

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phaseColor }} />
        <span className="text-xs font-mono text-zinc-500">{PHASE_DESCRIPTIONS[phase]}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-12 space-y-3">
            <div
              className="inline-block px-4 py-2 rounded-lg text-xs font-mono border"
              style={{ color: phaseColor, borderColor: `${phaseColor}40`, backgroundColor: `${phaseColor}08` }}
            >
              {phase.toUpperCase()} MODE
            </div>
            <p className="text-xs text-zinc-600 max-w-xs mx-auto leading-relaxed">
              {PHASE_PROMPTS[phase]}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            projectId={projectId}
            phase={phase}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  )
}
