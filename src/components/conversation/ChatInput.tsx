'use client'

import { useState, useRef } from 'react'

interface Props {
  onSend: (content: string, role: 'user' | 'assistant') => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [content, setContent] = useState('')
  const [role, setRole] = useState<'user' | 'assistant'>('user')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
    await onSend(text, role)
    setContent('')
    setSending(false)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-zinc-800 p-4 space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setRole('user')}
          className={`text-xs font-mono px-3 py-1 rounded-full transition-colors ${
            role === 'user'
              ? 'bg-[#7c6dfa] text-white'
              : 'border border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          You
        </button>
        <button
          onClick={() => setRole('assistant')}
          className={`text-xs font-mono px-3 py-1 rounded-full transition-colors ${
            role === 'assistant'
              ? 'bg-zinc-700 text-zinc-100'
              : 'border border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Agent
        </button>
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={role === 'user' ? '輸入你的訊息... (⌘↵ 送出)' : '輸入 Agent 的回應...'}
          rows={3}
          disabled={disabled || sending}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#7c6dfa] resize-none disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
          className="px-4 py-3 bg-[#7c6dfa] hover:bg-[#6c5df0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-mono transition-colors"
        >
          送出
        </button>
      </div>
    </div>
  )
}
