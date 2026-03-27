import type { Project, Conversation, Ticket, Role, ProjectDoc } from '@/types'

export interface StorageAdapter {
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  saveProject(p: Project): Promise<void>
  deleteProject(id: string): Promise<void>
  saveConversation(projectId: string, c: Conversation): Promise<void>
  saveTicket(projectId: string, t: Ticket): Promise<void>
  updateTicket(projectId: string, t: Ticket): Promise<void>
  deleteTicket(projectId: string, ticketId: string): Promise<void>
  getRoles(): Promise<Role[]>
  saveRole(r: Role): Promise<void>
  deleteRole(id: string): Promise<void>
  saveDoc(projectId: string, doc: ProjectDoc): Promise<void>
  deleteDoc(projectId: string, docId: string): Promise<void>
}
