'use client'

import { useState, useRef } from 'react'
import type { Ticket } from '@/types'
import { useAppStore } from '@/store/appStore'

function formatDate(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${min} ${mm}/${dd}`
}

interface Props {
  ticket: Ticket
  projectId: string
}

export function TicketWorkLog({ ticket, projectId }: Props) {
  const { addWorkLog, deleteWorkLog } = useAppStore()
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const logs = ticket.workLogs ?? []

  async function handleSubmit() {
    const text = content.trim()
    if (!text || submitting) return
    setSubmitting(true)
    await addWorkLog(projectId, ticket.id, text, author.trim() || undefined)
    setContent('')
    setSubmitting(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3">
      {/* Log entries */}
      {logs.length > 0 && (
        <div className="space-y-3 mb-3">
          {logs.map((log) => (
            <div key={log.id} className="group flex gap-2">
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                <div className="w-px flex-1 bg-zinc-800 mt-1" />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-zinc-600">{formatDate(log.createdAt)}</span>
                  {log.author && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {log.author}
                    </span>
                  )}
                  <button
                    onClick={() => deleteWorkLog(projectId, ticket.id, log.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 text-[10px] transition-opacity"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">{log.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="space-y-1.5">
        <input
          className="w-full bg-zinc-800/50 text-zinc-400 text-[11px] font-mono rounded px-2 py-1 border border-zinc-800 focus:border-zinc-700 outline-none placeholder-zinc-700"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="署名（選填）"
        />
        <div className="flex gap-1.5">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-zinc-800/50 text-zinc-300 text-xs font-mono rounded px-2 py-1.5 border border-zinc-800 focus:border-zinc-700 outline-none resize-none placeholder-zinc-700"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="記錄進度... (⌘↵ 送出)"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="px-2 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 rounded border border-zinc-700 transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
