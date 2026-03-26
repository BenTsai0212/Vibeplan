'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { Sidebar } from './Sidebar'
import { PhaseTabBar } from '@/components/project/PhaseTabBar'
import { ConversationPanel } from '@/components/conversation/ConversationPanel'
import { TicketPanel } from '@/components/tickets/TicketPanel'
import { RoleBoard } from '@/components/roles/RoleBoard'

function GitHubContextPanel({ projectId }: { projectId: string }) {
  const { projects, updateProjectGithub } = useAppStore()
  const project = projects.find((p) => p.id === projectId)
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(project?.githubRepoUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSync() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/github/fetch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      await updateProjectGithub(projectId, url.trim(), data.context)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync 失敗')
    } finally {
      setLoading(false)
    }
  }

  const synced = !!project?.githubRepoUrl && !!project?.githubContext

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setUrl(project?.githubRepoUrl ?? '') }}
        className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border transition-colors ${
          synced
            ? 'border-emerald-800 text-emerald-500 hover:border-emerald-600'
            : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
        }`}
        title="連結 GitHub Repository"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        {synced ? '✓ GitHub' : 'GitHub'}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl z-20">
          <p className="text-xs font-mono text-zinc-400 mb-2">GitHub Repository URL</p>
          <input
            className="w-full bg-zinc-800 text-zinc-100 text-xs font-mono rounded px-2 py-1.5 border border-zinc-700 focus:border-[#7c6dfa] outline-none mb-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSync()}
          />
          {error && <p className="text-xs text-red-400 font-mono mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={!url.trim() || loading}
              className="flex-1 text-xs font-mono py-1.5 rounded bg-[#7c6dfa] text-white hover:bg-[#6d5ee8] disabled:opacity-40 transition-colors"
            >
              {loading ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 text-xs font-mono py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppShell() {
  const { init, mounted, activeProject, activeView } = useAppStore()

  useEffect(() => {
    init()
  }, [init])

  if (!mounted) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs font-mono text-zinc-600 animate-pulse">Loading...</span>
      </div>
    )
  }

  const project = activeProject()

  if (activeView === 'role') {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100 grid grid-cols-[220px_1fr] overflow-hidden">
        <Sidebar />
        <RoleBoard />
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 grid grid-cols-[220px_1fr_300px] overflow-hidden">
      <Sidebar />

      <main className="flex flex-col min-w-0 border-r border-zinc-800">
        {project ? (
          <>
            <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-3">
              <h1 className="text-sm font-mono font-medium text-zinc-200 truncate flex-1">{project.name}</h1>
              <GitHubContextPanel projectId={project.id} />
            </div>
            <PhaseTabBar />
            <div className="flex-1 min-h-0">
              <ConversationPanel
                key={`${project.id}-${project.currentPhase}`}
                projectId={project.id}
                phase={project.currentPhase}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center space-y-2">
              <p className="text-2xl font-serif text-zinc-400">Vibe Planner</p>
              <p className="text-xs font-mono text-zinc-600">選擇左側專案，或建立一個新的</p>
            </div>
          </div>
        )}
      </main>

      <TicketPanel />
    </div>
  )
}
