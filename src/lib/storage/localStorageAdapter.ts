import type { Project, Conversation, Ticket } from '@/types'
import type { StorageAdapter } from './adapter'

const STORAGE_KEY = 'vibeplan_projects'

function loadAll(): Project[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveAll(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export const localStorageAdapter: StorageAdapter = {
  async getProjects() {
    return loadAll()
  },

  async getProject(id: string) {
    return loadAll().find((p) => p.id === id) ?? null
  },

  async saveProject(p: Project) {
    const all = loadAll()
    const idx = all.findIndex((x) => x.id === p.id)
    if (idx >= 0) {
      all[idx] = p
    } else {
      all.push(p)
    }
    saveAll(all)
  },

  async deleteProject(id: string) {
    saveAll(loadAll().filter((p) => p.id !== id))
  },

  async saveConversation(projectId: string, c: Conversation) {
    const all = loadAll()
    const project = all.find((p) => p.id === projectId)
    if (!project) return
    const idx = project.conversations.findIndex((x) => x.id === c.id)
    if (idx >= 0) {
      project.conversations[idx] = c
    } else {
      project.conversations.push(c)
    }
    saveAll(all)
  },

  async saveTicket(projectId: string, t: Ticket) {
    const all = loadAll()
    const project = all.find((p) => p.id === projectId)
    if (!project) return
    project.tickets.push(t)
    saveAll(all)
  },

  async updateTicket(projectId: string, t: Ticket) {
    const all = loadAll()
    const project = all.find((p) => p.id === projectId)
    if (!project) return
    const idx = project.tickets.findIndex((x) => x.id === t.id)
    if (idx >= 0) project.tickets[idx] = t
    saveAll(all)
  },

  async deleteTicket(projectId: string, ticketId: string) {
    const all = loadAll()
    const project = all.find((p) => p.id === projectId)
    if (!project) return
    project.tickets = project.tickets.filter((t) => t.id !== ticketId)
    saveAll(all)
  },
}
