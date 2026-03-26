'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectCreateModal } from '@/components/project/ProjectCreateModal'
import { RoleCreateModal } from '@/components/roles/RoleCreateModal'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const { projects, activeProjectId, activeRoleId, activeView, roles, setActiveRole, createRole } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showRoleCreate, setShowRoleCreate] = useState(false)

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

      {/* Projects */}
      <div className="overflow-y-auto px-2 py-2 space-y-1">
        <p className="px-2 pt-1 pb-0.5 text-[10px] font-mono font-medium text-zinc-700 uppercase tracking-widest">
          Projects
        </p>
        {projects.length === 0 ? (
          <div className="px-2 pt-2 text-center">
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
            <div key={project.id} onClick={() => onClose?.()}>
              <ProjectCard
                project={project}
                isActive={activeView === 'project' && project.id === activeProjectId}
              />
            </div>
          ))
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800 mx-3" />

      {/* People / Roles */}
      <div className="px-2 py-2 space-y-1">
        <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
          <p className="text-[10px] font-mono font-medium text-zinc-700 uppercase tracking-widest">
            People
          </p>
          <button
            onClick={() => setShowRoleCreate(true)}
            className="text-[10px] font-mono text-zinc-600 hover:text-[#7c6dfa] transition-colors"
            title="新增角色"
          >
            +
          </button>
        </div>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => { setActiveRole(role.id); onClose?.() }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
              activeView === 'role' && activeRoleId === role.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
            <span className="text-xs font-mono truncate">{role.name}</span>
          </button>
        ))}
      </div>

      {showCreate && <ProjectCreateModal onClose={() => setShowCreate(false)} />}
      {showRoleCreate && (
        <RoleCreateModal
          onSave={(name, color) => createRole(name, color)}
          onClose={() => setShowRoleCreate(false)}
        />
      )}
    </aside>
  )
}
