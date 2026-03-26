import { create } from 'zustand'
import type { Project, Phase, Message, Ticket, AgentId, Conversation } from '@/types'
import { localStorageAdapter } from '@/lib/storage/localStorageAdapter'
import { createId, nowISO } from '@/lib/utils'

interface AppStore {
  projects: Project[]
  activeProjectId: string | null
  mounted: boolean

  // Derived
  activeProject: () => Project | null

  // Init
  init: () => Promise<void>

  // Project actions
  createProject: (name: string) => Promise<Project>
  setActiveProject: (id: string) => void
  deleteProject: (id: string) => Promise<void>
  setCurrentPhase: (phase: Phase) => Promise<void>

  // Conversation actions
  addMessage: (projectId: string, phase: Phase, role: Message['role'], content: string) => Promise<void>

  // Ticket actions
  addTicket: (projectId: string, ticket: Omit<Ticket, 'id' | 'createdAt'>) => Promise<Ticket>
  updateTicketStatus: (projectId: string, ticketId: string, status: Ticket['status']) => Promise<void>
  updateTicket: (projectId: string, ticket: Ticket) => Promise<void>
  deleteTicket: (projectId: string, ticketId: string) => Promise<void>
  convertMessageToTicket: (
    projectId: string,
    phase: Phase,
    message: Message,
    extra: { title: string; reason: string; assignedTo: AgentId | null }
  ) => Promise<Ticket>
}

export const useAppStore = create<AppStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  mounted: false,

  activeProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find((p) => p.id === activeProjectId) ?? null
  },

  init: async () => {
    const projects = await localStorageAdapter.getProjects()
    set({ projects, mounted: true })
  },

  createProject: async (name: string) => {
    const project: Project = {
      id: createId(),
      name,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      currentPhase: 'research',
      conversations: [],
      tickets: [],
    }
    await localStorageAdapter.saveProject(project)
    set((state) => ({ projects: [...state.projects, project], activeProjectId: project.id }))
    return project
  },

  setActiveProject: (id: string) => {
    set({ activeProjectId: id })
  },

  deleteProject: async (id: string) => {
    await localStorageAdapter.deleteProject(id)
    set((state) => {
      const projects = state.projects.filter((p) => p.id !== id)
      const activeProjectId = state.activeProjectId === id
        ? (projects[0]?.id ?? null)
        : state.activeProjectId
      return { projects, activeProjectId }
    })
  },

  setCurrentPhase: async (phase: Phase) => {
    const project = get().activeProject()
    if (!project) return
    const updated: Project = { ...project, currentPhase: phase, updatedAt: nowISO() }
    await localStorageAdapter.saveProject(updated)
    set((state) => ({
      projects: state.projects.map((p) => p.id === updated.id ? updated : p),
    }))
  },

  addMessage: async (projectId: string, phase: Phase, role: Message['role'], content: string) => {
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

    await localStorageAdapter.saveConversation(projectId, updatedConversation)

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

  addTicket: async (projectId: string, ticketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    const ticket: Ticket = {
      ...ticketData,
      id: createId(),
      createdAt: nowISO(),
    }
    await localStorageAdapter.saveTicket(projectId, ticket)
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
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const ticket = project.tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    const updated = { ...ticket, status }
    await localStorageAdapter.updateTicket(projectId, updated)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.map((t) => t.id === ticketId ? updated : t) }
          : p
      ),
    }))
  },

  updateTicket: async (projectId: string, ticket: Ticket) => {
    await localStorageAdapter.updateTicket(projectId, ticket)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, tickets: p.tickets.map((t) => t.id === ticket.id ? ticket : t) }
          : p
      ),
    }))
  },

  deleteTicket: async (projectId: string, ticketId: string) => {
    await localStorageAdapter.deleteTicket(projectId, ticketId)
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
}))
