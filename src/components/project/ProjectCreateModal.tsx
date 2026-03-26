'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'

export function ProjectCreateModal({ onClose }: { onClose: () => void }) {
  const { createProject } = useAppStore()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    await createProject(name.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6">
        <h2 className="text-sm font-mono font-medium text-zinc-200 mb-4">新建專案</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="專案名稱..."
            className="w-full bg-transparent border border-zinc-700 rounded-lg px-4 py-3 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#7c6dfa]"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-4 py-2 text-sm font-mono bg-[#7c6dfa] hover:bg-[#6c5df0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
