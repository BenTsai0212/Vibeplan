'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { RoleTicketCard } from './RoleTicketCard'
import { RoleCreateModal } from './RoleCreateModal'
import type { Project, Ticket } from '@/types'

export function RoleBoard() {
  const { activeRole, activeRoleId, getTicketsByRole, updateRole, deleteRole, setActiveProject, projects } = useAppStore()
  const [showEdit, setShowEdit] = useState(false)

  const role = activeRole()
  if (!role || !activeRoleId) {
    return (
      <main className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-sm">
        選擇一個角色
      </main>
    )
  }

  const roleTickets = getTicketsByRole(activeRoleId)

  // Group by project
  const byProject = roleTickets.reduce<Record<string, { project: Project; tickets: Ticket[] }>>(
    (acc, { ticket, project }) => {
      if (!acc[project.id]) acc[project.id] = { project, tickets: [] }
      acc[project.id].tickets.push(ticket)
      return acc
    },
    {}
  )

  const projectGroups = Object.values(byProject)
  const totalDone = roleTickets.filter(({ ticket }) => ticket.status === 'done').length

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
        <h1 className="text-lg font-mono font-medium text-zinc-100">{role.name}</h1>
        <span className="text-xs font-mono text-zinc-600 ml-1">
          {totalDone}/{roleTickets.length} 完成
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="text-xs font-mono px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
          >
            ✎ 編輯
          </button>
          <button
            onClick={async () => {
              if (!confirm(`確定刪除「${role.name}」角色？`)) return
              await deleteRole(role.id)
              const firstProject = projects[0]
              if (firstProject) setActiveProject(firstProject.id)
            }}
            className="text-xs font-mono px-3 py-1.5 rounded border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-900 transition-colors"
          >
            刪除
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {roleTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full mb-4 opacity-20" style={{ backgroundColor: role.color }} />
            <p className="text-sm font-mono text-zinc-600">此角色尚無指派工作</p>
            <p className="text-xs font-mono text-zinc-700 mt-1">在 Ticket 的指派欄位選擇「{role.name}」來分配工作</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            {projectGroups.map(({ project, tickets }) => (
              <div key={project.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    {project.name}
                  </span>
                  <span className="text-xs font-mono text-zinc-700">{tickets.length}</span>
                  <div className="flex-1 border-t border-zinc-800 ml-1" />
                </div>
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <RoleTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      projectId={project.id}
                      projectName={project.name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <RoleCreateModal
          initial={role}
          onSave={(name, color) => updateRole({ ...role, name, color })}
          onClose={() => setShowEdit(false)}
        />
      )}
    </main>
  )
}
