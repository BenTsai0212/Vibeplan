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
        <div className="absolute top-full right-0 mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl z-20">
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

function HamburgerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function AppShell() {
  const { init, mounted, activeProject, activeView } = useAppStore()
  const [showSidebar, setShowSidebar] = useState(false)
  const [mobileTab, setMobileTab] = useState<'chat' | 'tickets'>('chat')

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

  /* ── Mobile sidebar drawer (shared) ── */
  const SidebarDrawer = showSidebar ? (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={() => setShowSidebar(false)} />
      <div className="absolute left-0 top-0 h-full w-[220px] z-10">
        <Sidebar onClose={() => setShowSidebar(false)} />
      </div>
    </div>
  ) : null

  /* ── Mobile header bar ── */
  const MobileHeader = (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
      <button
        onClick={() => setShowSidebar(true)}
        className="text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <HamburgerIcon />
      </button>
      <span className="text-sm font-mono text-zinc-200 truncate flex-1">
        {project?.name ?? 'Vibe Planner'}
      </span>
      {project && activeView === 'project' && <GitHubContextPanel projectId={project.id} />}
    </div>
  )

  if (activeView === 'role') {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:grid lg:grid-cols-[220px_1fr] lg:grid-rows-[1fr] overflow-hidden">
        {SidebarDrawer}
        {MobileHeader}
        <div className="hidden lg:flex lg:flex-col overflow-hidden">
          <Sidebar />
        </div>
        <RoleBoard />
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:grid lg:grid-cols-[220px_1fr_300px] lg:grid-rows-[1fr] overflow-hidden">
      {SidebarDrawer}
      {MobileHeader}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col overflow-hidden">
        <Sidebar />
      </div>

      {/* Main chat area */}
      <main className={`flex flex-col min-w-0 overflow-hidden border-r border-zinc-800 flex-1 lg:flex-none ${
        mobileTab === 'chat' ? '' : 'hidden lg:flex'
      }`}>
        {project ? (
          <>
            <div className="hidden lg:flex px-6 py-3 border-b border-zinc-800 items-center gap-3 shrink-0">
              <h1 className="text-sm font-mono font-medium text-zinc-200 truncate flex-1">{project.name}</h1>
              <GitHubContextPanel projectId={project.id} />
            </div>
            <PhaseTabBar />
            <div className="flex-1 min-h-0 overflow-hidden">
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

      {/* Ticket panel */}
      <div className={`flex flex-col overflow-hidden flex-1 lg:flex-none ${
        mobileTab === 'tickets' ? '' : 'hidden lg:flex'
      }`}>
        <TicketPanel />
      </div>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden flex border-t border-zinc-800 bg-zinc-950 shrink-0">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 text-xs font-mono transition-colors ${
            mobileTab === 'chat' ? 'text-[#7c6dfa]' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setMobileTab('tickets')}
          className={`flex-1 py-3 text-xs font-mono transition-colors ${
            mobileTab === 'tickets' ? 'text-[#7c6dfa]' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Tickets
        </button>
      </div>
    </div>
  )
}
