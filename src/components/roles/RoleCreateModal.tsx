'use client'

import { useState } from 'react'
import type { Role } from '@/types'

const PRESET_COLORS = [
  '#60a5fa', '#f472b6', '#fb923c', '#a78bfa',
  '#4ade80', '#fbbf24', '#f87171', '#34d399',
]

interface Props {
  initial?: Role
  onSave: (name: string, color: string) => void
  onClose: () => void
}

export function RoleCreateModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), color)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-mono font-medium text-zinc-200 mb-4">
          {initial ? '編輯角色' : '新增角色'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-1 block">角色名稱</label>
            <input
              className="w-full bg-zinc-800 text-zinc-100 text-sm font-mono rounded px-3 py-2 border border-zinc-700 focus:border-[#7c6dfa] outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 工程師"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-2 block">顏色</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'white' : 'transparent',
                    opacity: color === c ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 text-sm font-mono py-2 rounded bg-[#7c6dfa] text-white hover:bg-[#6d5ee8] transition-colors"
            >
              {initial ? '儲存' : '建立'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-mono py-2 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
