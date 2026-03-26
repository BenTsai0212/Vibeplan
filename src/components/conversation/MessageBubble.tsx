import type { Message, Phase } from '@/types'
import { MessageActions } from './MessageActions'

interface Props {
  message: Message
  projectId: string
  phase: Phase
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, projectId, phase }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#7c6dfa] text-white rounded-br-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700'
        }`}
      >
        {message.content}
      </div>
      <div className={`flex items-center gap-2 mt-1 ${isUser ? 'flex-row-reverse' : ''}`}>
        <span className="text-xs font-mono text-zinc-600 opacity-60">{formatTime(message.createdAt)}</span>
        {!isUser && (
          <MessageActions message={message} projectId={projectId} phase={phase} />
        )}
      </div>
    </div>
  )
}
