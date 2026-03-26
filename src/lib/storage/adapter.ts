import type { Project, Conversation, Ticket } from '@/types'

export interface StorageAdapter {
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  saveProject(p: Project): Promise<void>
  deleteProject(id: string): Promise<void>
  saveConversation(projectId: string, c: Conversation): Promise<void>
  saveTicket(projectId: string, t: Ticket): Promise<void>
  updateTicket(projectId: string, t: Ticket): Promise<void>
  deleteTicket(projectId: string, ticketId: string): Promise<void>
}
