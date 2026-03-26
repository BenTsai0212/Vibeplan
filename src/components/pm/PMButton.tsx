'use client'

import { useState } from 'react'
import type { Phase } from '@/types'
import type { PMAnalyzeResponse } from '@/types'
import { PMConfirmPanel } from './PMConfirmPanel'
import { useAppStore } from '@/store/appStore'

export function PMButton({ projectId, currentPhase }: { projectId: string; currentPhase: Phase }) {
  const activeProject = useAppStore((s) => s.activeProject())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PMAnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!activeProject) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pm/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversations: activeProject.conversations,
          tickets: activeProject.tickets,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data: PMAnalyzeResponse = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#a78bfa40] text-[#a78bfa] hover:bg-[#a78bfa10] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
        {loading ? 'PM 分析中...' : '請 PM 整理工作'}
      </button>

      {error && (
        <p className="text-xs text-red-400 font-mono text-center mt-1">{error}</p>
      )}

      {result && (
        <PMConfirmPanel
          projectId={projectId}
          currentPhase={currentPhase}
          thinking={result.thinking}
          proposed={result.tickets}
          onClose={() => setResult(null)}
        />
      )}
    </>
  )
}
