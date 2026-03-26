export type Phase = 'research' | 'plan' | 'execute' | 'review'
export type AgentId = 'fe' | 'be' | 'ux' | 'pm'
export type TicketStatus = 'todo' | 'in_progress' | 'done'
export type MessageRole = 'user' | 'assistant'

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

export interface Ticket {
  id: string
  projectId: string
  title: string
  reason: string
  phase: Phase
  assignedTo: AgentId | null
  status: TicketStatus
  createdBy: 'user' | 'pm'
  contextSnippet: string
  createdAt: string
  priority?: 'high' | 'medium' | 'low'
}

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  currentPhase: Phase
  conversations: Conversation[]
  tickets: Ticket[]
}

export interface PMAnalyzeRequest {
  conversations: Conversation[]
  tickets: Ticket[]
}

export interface PMProposedTicket {
  title: string
  reason: string
  assignTo: AgentId
  priority: 'high' | 'medium' | 'low'
}

export interface PMAnalyzeResponse {
  thinking: string
  tickets: PMProposedTicket[]
}
