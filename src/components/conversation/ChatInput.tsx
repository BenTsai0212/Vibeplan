'use client'

import { useState, useRef } from 'react'

interface Props {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    const text = content.trim()
    if (!text || sending || disabled) return
    setSending(true)
    setContent('')
    await onSend(text)
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
    <div className="border-t border-zinc-800 p-4">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入訊息... (⌘↵ 送出)"
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
