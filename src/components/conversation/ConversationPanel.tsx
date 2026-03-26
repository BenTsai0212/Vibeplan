'use client'

import { useEffect, useRef, useState } from 'react'
import type { Phase } from '@/types'
import { useAppStore } from '@/store/appStore'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { PHASE_DESCRIPTIONS } from '@/lib/agents/prompts'

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
  const { addMessage, clearConversation, projects } = useAppStore()
  const project = projects.find((p) => p.id === projectId)
  const conversation = project?.conversations.find((c) => c.phase === phase)
  const messages = conversation?.messages ?? []
  const githubContext = project?.githubContext

  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    shouldAutoScrollRef.current = distFromBottom < 100
  }

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, streamingContent])

  async function handleSend(content: string) {
    shouldAutoScrollRef.current = true
    await addMessage(projectId, phase, 'user', content)

    setStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase,
          messages: [...messages, { id: '', role: 'user', content, createdAt: '' }],
          githubContext,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              fullContent += parsed.text
              setStreamingContent(fullContent)
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      if (fullContent) {
        await addMessage(projectId, phase, 'assistant', fullContent)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 回應失敗'
      await addMessage(projectId, phase, 'assistant', `⚠️ ${msg}`)
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }

  async function handleRefresh() {
    if (!confirm('清除此 phase 的所有對話？')) return
    await clearConversation(projectId, phase)
  }

  const phaseColor = PHASE_COLORS[phase]

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phaseColor }} />
        <span className="text-xs font-mono text-zinc-500 flex-1">{PHASE_DESCRIPTIONS[phase]}</span>
        <button
          onClick={handleRefresh}
          className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
          title="清除對話"
        >
          ↺ Refresh
        </button>
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center pt-12">
            <div
              className="inline-block px-4 py-2 rounded-lg text-xs font-mono border"
              style={{ color: phaseColor, borderColor: `${phaseColor}40`, backgroundColor: `${phaseColor}08` }}
            >
              {phase.toUpperCase()} MODE
            </div>
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

        {streaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-zinc-800 text-zinc-100 text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-zinc-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {streaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-zinc-800">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  )
}
