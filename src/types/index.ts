export type Phase = 'research' | 'plan' | 'execute' | 'review'
export type TicketStatus = 'todo' | 'in_progress' | 'done'
export type MessageRole = 'user' | 'assistant'

export interface Role {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  projectId: string
  phase: Phase
  messages: Message[]
  createdAt: string
}

export interface WorkLog {
  id: string
  content: string
  createdAt: string
  author?: string
}

export interface Ticket {
  id: string
  projectId: string
  title: string
  reason: string
  phase: Phase
  assignedTo: string | null   // Role.id
  status: TicketStatus
  createdBy: 'user' | 'pm'
  contextSnippet: string
  acceptanceCriteria?: string
  createdAt: string
  priority?: 'high' | 'medium' | 'low'
  workLogs?: WorkLog[]
}

export interface ProjectDoc {
  id: string
  projectId: string
  title: string
  content: string   // markdown
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  currentPhase: Phase
  conversations: Conversation[]
  tickets: Ticket[]
  docs?: ProjectDoc[]
  githubRepoUrl?: string
  githubContext?: string
}

export interface PMAnalyzeRequest {
  conversations: Conversation[]
  tickets: Ticket[]
  roles: Role[]
}

export interface PMProposedTicket {
  title: string
  reason: string
  acceptanceCriteria?: string
  contextSnippet?: string
  assignTo: string   // role name (matched to Role.id in frontend)
  priority: 'high' | 'medium' | 'low'
}

export interface PMAnalyzeResponse {
  thinking: string
  tickets: PMProposedTicket[]
}
