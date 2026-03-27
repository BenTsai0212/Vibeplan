import { create } from 'zustand'
import type { Project, Phase, Message, Ticket, Conversation, Role, WorkLog, ProjectDoc } from '@/types'
import { getStorage } from '@/lib/storage'
import { createId, nowISO } from '@/lib/utils'

const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt'>[] = [
  { name: '工程師', color: '#60a5fa' },
  { name: '設計師', color: '#f472b6' },
  { name: '行銷', color: '#fb923c' },
  { name: '市調', color: '#a78bfa' },
]

interface AppStore {
  projects: Project[]
  activeProjectId: string | null
  mounted: boolean

  // Roles
  roles: Role[]
  activeView: 'project' | 'role'
  activeRoleId: string | null

  // Derived
  activeProject: () => Project | null
  activeRole: () => Role | null
  getTicketsByRole: (roleId: string) => { ticket: Ticket; project: Project }[]

  // Init
  init: () => Promise<void>

  // Project actions
  createProject: (name: string) => Promise<Project>
  setActiveProject: (id: string) => void
  deleteProject: (id: string) => Promise<void>
  setCurrentPhase: (phase: Phase) => Promise<void>

  // Conversation actions
  addMessage: (projectId: string, phase: Phase, role: Message['role'], content: string) => Promise<void>
  clearConversation: (projectId: string, phase: Phase) => Promise<void>

  // Project GitHub
  updateProjectGithub: (projectId: string, repoUrl: string, context: string) => Promise<void>

  // Ticket actions
  addTicket: (projectId: string, ticket: Omit<Ticket, 'id' | 'createdAt'>) => Promise<Ticket>
  updateTicketStatus: (projectId: string, ticketId: string, status: Ticket['status']) => Promise<void>
  updateTicket: (projectId: string, ticket: Ticket) => Promise<void>
  deleteTicket: (projectId: string, ticketId: string) => Promise<void>
  convertMessageToTicket: (
    projectId: string,
    phase: Phase,
    message: Message,
    extra: { title: string; reason: string; assignedTo: string | null }
  ) => Promise<Ticket>

  // Work log actions
  addWorkLog: (projectId: string, ticketId: string, content: string, author?: string) => Promise<void>
  deleteWorkLog: (projectId: string, ticketId: string, logId: string) => Promise<void>

  // Role actions
  createRole: (name: string, color: string) => Promise<Role>
  updateRole: (role: Role) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  setActiveRole: (id: string) => void

  // Doc actions
  createDoc: (projectId: string, title: string) => Promise<ProjectDoc>
  updateDoc: (projectId: string, doc: ProjectDoc) => Promise<void>
  deleteDoc: (projectId: string, docId: string) => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  mounted: false,
  roles: [],
  activeView: 'project',
  activeRoleId: null,

  activeProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find((p) => p.id === activeProjectId) ?? null
  },

  activeRole: () => {
    const { roles, activeRoleId } = get()
    return roles.find((r) => r.id === activeRoleId) ?? null
  },

  getTicketsByRole: (roleId: string) => {
    const { projects } = get()
    const result: { ticket: Ticket; project: Project }[] = []
    for (const project of projects) {
      for (const ticket of project.tickets) {
        if (ticket.assignedTo === roleId) {
          result.push({ ticket, project })
        }
      }
    }
    return result
  },

  init: async () => {
    const storage = getStorage()
    const [projects, existingRoles] = await Promise.all([
      storage.getProjects(),
      storage.getRoles(),
    ])

    let roles = existingRoles
    if (roles.length === 0) {
      roles = await Promise.all(
        DEFAULT_ROLES.map(async (r) => {
          const role: Role = { id: createId(), name: r.name, color: r.color, createdAt: nowISO() }
          await storage.saveRole(role)
          return role
        })
      )
    }

    set({ projects, roles, mounted: true })
  },

  createProject: async (name: string) => {
    const storage = getStorage()
    const project: Project = {
      id: createId(),
      name,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      currentPhase: 'research',
      conversations: [],
      tickets: [],
      docs: [],
    }
    await storage.saveProject(project)
    set((state) => ({ projects: [...state.projects, project], activeProjectId: project.id, activeView: 'project' }))
    return project
  },

  setActiveProject: (id: string) => {
    set({ activeProjectId: id, activeView: 'project', activeRoleId: null })
  },

  deleteProject: async (id: string) => {
    const storage = getStorage()
    await storage.deleteProject(id)
    set((state) => {
      const projects = state.projects.filter((p) => p.id !== id)
      const activeProjectId = state.activeProjectId === id
        ? (projects[0]?.id ?? null)
        : state.activeProjectId
      return { projects, activeProjectId }
    })
  },

  setCurrentPhase: async (phase: Phase) => {
    const storage = getStorage()
    const project = get().activeProject()
    if (!project) return
    const updated: Project = { ...project, currentPhase: phase, updatedAt: nowISO() }
    await storage.saveProject(updated)
    set((state) => ({
      projects: state.projects.map((p) => p.id === updated.id ? updated : p),
    }))
  },

  addMessage: async (projectId: string, phase: Phase, role: Message['role'], content: string) => {
    const storage = getStorage()
    const projects = get().projects
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const message: Message = {
      id: createId(),
      role,
      content,
      createdAt: nowISO(),
    }

    let conversation = project.conversations.find((c) => c.phase === phase)
    if (!conversation) {
      conversation = {
        id: createId(),
        projectId,
        phase,
        messages: [],
        createdAt: nowISO(),
      }
    }

    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, message],
    }

    await storage.saveConversation(projectId, updatedConversation)

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        const existingIdx = p.conversations.findIndex((c) => c.phase === phase)
        const conversations = existingIdx >= 0
          ? p.conversations.map((c, i) => i === existingIdx ? updatedConversation : c)
          : [...p.conversations, updatedConversation]
        return { ...p, conversations, updatedAt: nowISO() }
      }),
    }))
  },

  clearConversation: async (projectId: string, phase: Phase) => {
    const storage = getStorage()
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const updated: Project = {
      ...project,
      conversations: project.conversations.map((c) =>
        c.phase === phase ? { ...c, messages: [] } : c
      ),
      updatedAt: nowISO(),
    }
    await storage.saveProject(updated)
    set((state) => ({
      projects: state.projects.map((p) => p.id === projectId ? updated : p),
    }))
  },

  updateProjectGithub: async (projectId: string, repoUrl: string, context: string) => {
    const storage = getStorage()
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const updated: Project = { ...project, githubRepoUrl: repoUrl, githubContext: context, updatedAt: nowISO() }
    await storage.saveProject(updated)
    set((state) => ({
      projects: state.projects.map((p) => p.id === projectId ? updated : p),
    }))
  },

  addTicket: async (projectId: string, ticketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    const storage = getStorage()
    const ticket: Ticket = {
      ...ticketData,
      id: createId(),
      createdAt: nowISO(),
    }
    await storage.saveTicket(projectId, ticket)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: [...p.tickets, ticket], updatedAt: nowISO() }
          : p
      ),
    }))
    return ticket
  },

  updateTicketStatus: async (projectId: string, ticketId: string, status: Ticket['status']) => {
    const storage = getStorage()
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const ticket = project.tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    const updated = { ...ticket, status }
    await storage.updateTicket(projectId, updated)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.map((t) => t.id === ticketId ? updated : t) }
          : p
      ),
    }))
  },

  updateTicket: async (projectId: string, ticket: Ticket) => {
    const storage = getStorage()
    await storage.updateTicket(projectId, ticket)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.map((t) => t.id === ticket.id ? ticket : t) }
          : p
      ),
    }))
  },

  deleteTicket: async (projectId: string, ticketId: string) => {
    const storage = getStorage()
    await storage.deleteTicket(projectId, ticketId)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.filter((t) => t.id !== ticketId) }
          : p
      ),
    }))
  },

  convertMessageToTicket: async (projectId, phase, message, extra) => {
    const ticket = await get().addTicket(projectId, {
      projectId,
      title: extra.title,
      reason: extra.reason,
      phase,
      assignedTo: extra.assignedTo,
      status: 'todo',
      createdBy: 'user',
      contextSnippet: message.content.slice(0, 200),
    })
    return ticket
  },

  addWorkLog: async (projectId: string, ticketId: string, content: string, author?: string) => {
    const storage = getStorage()
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const ticket = project.tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    const log: WorkLog = { id: createId(), content, createdAt: nowISO(), author }
    const updated = { ...ticket, workLogs: [...(ticket.workLogs ?? []), log] }
    await storage.updateTicket(projectId, updated)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.map((t) => t.id === ticketId ? updated : t) }
          : p
      ),
    }))
  },

  deleteWorkLog: async (projectId: string, ticketId: string, logId: string) => {
    const storage = getStorage()
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const ticket = project.tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    const updated = { ...ticket, workLogs: (ticket.workLogs ?? []).filter((l) => l.id !== logId) }
    await storage.updateTicket(projectId, updated)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.map((t) => t.id === ticketId ? updated : t) }
          : p
      ),
    }))
  },

  createRole: async (name: string, color: string) => {
    const storage = getStorage()
    const role: Role = { id: createId(), name, color, createdAt: nowISO() }
    await storage.saveRole(role)
    set((state) => ({ roles: [...state.roles, role] }))
    return role
  },

  updateRole: async (role: Role) => {
    const storage = getStorage()
    await storage.saveRole(role)
    set((state) => ({
      roles: state.roles.map((r) => r.id === role.id ? role : r),
    }))
  },

  deleteRole: async (id: string) => {
    const storage = getStorage()
    await storage.deleteRole(id)
    set((state) => ({
      roles: state.roles.filter((r) => r.id !== id),
      activeRoleId: state.activeRoleId === id ? null : state.activeRoleId,
      activeView: state.activeRoleId === id ? 'project' : state.activeView,
    }))
  },

  setActiveRole: (id: string) => {
    set({ activeRoleId: id, activeView: 'role' })
  },

  createDoc: async (projectId: string, title: string) => {
    const storage = getStorage()
    const doc: ProjectDoc = {
      id: createId(),
      projectId,
      title,
      content: '',
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    await storage.saveDoc(projectId, doc)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, docs: [...(p.docs ?? []), doc], updatedAt: nowISO() }
          : p
      ),
    }))
    return doc
  },

  updateDoc: async (projectId: string, doc: ProjectDoc) => {
    const storage = getStorage()
    const updated = { ...doc, updatedAt: nowISO() }
    await storage.saveDoc(projectId, updated)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, docs: (p.docs ?? []).map((d) => d.id === doc.id ? updated : d) }
          : p
      ),
    }))
  },

  deleteDoc: async (projectId: string, docId: string) => {
    const storage = getStorage()
    await storage.deleteDoc(projectId, docId)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, docs: (p.docs ?? []).filter((d) => d.id !== docId) }
          : p
      ),
    }))
  },
}))
