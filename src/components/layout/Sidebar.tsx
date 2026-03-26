'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectCreateModal } from '@/components/project/ProjectCreateModal'

export function Sidebar() {
  const { projects, activeProjectId } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <aside className="flex flex-col h-full border-r border-zinc-800 bg-zinc-950">
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-widest">
            Vibe Planner
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs font-mono px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-[#7c6dfa] hover:border-[#7c6dfa60] transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {projects.length === 0 ? (
          <div className="px-2 pt-4 text-center">
            <p className="text-xs text-zinc-700 font-mono">還沒有專案</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-xs font-mono text-[#7c6dfa] hover:text-[#9d8ffb] transition-colors"
            >
              建立第一個
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
            />
          ))
        )}
      </div>

      {showCreate && <ProjectCreateModal onClose={() => setShowCreate(false)} />}
    </aside>
  )
}
