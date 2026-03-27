import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Project, Conversation, Ticket, Role, ProjectDoc, Phase } from '@/types'
import type { StorageAdapter } from './adapter'

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// Map DB row → nested Project object
function rowToProject(row: Record<string, unknown>): Project {
  const conversations: Conversation[] = ((row.conversations as Record<string, unknown>[]) ?? []).map((c) => ({
    id: c.id as string,
    projectId: row.id as string,
    phase: c.phase as Phase,
    createdAt: c.created_at as string,
    messages: ((c.messages as Record<string, unknown>[]) ?? [])
      .sort((a, b) => (a.created_at as string).localeCompare(b.created_at as string))
      .map((m) => ({
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        createdAt: m.created_at as string,
      })),
  }))

  const tickets: Ticket[] = ((row.tickets as Record<string, unknown>[]) ?? [])
    .sort((a, b) => (a.created_at as string).localeCompare(b.created_at as string))
    .map((t) => ({
      id: t.id as string,
      projectId: row.id as string,
      title: t.title as string,
      reason: t.reason as string,
      phase: t.phase as Phase,
      assignedTo: (t.assigned_to as string | null) ?? null,
      status: t.status as Ticket['status'],
      createdBy: t.created_by as 'user' | 'pm',
      contextSnippet: (t.context_snippet as string) ?? '',
      acceptanceCriteria: (t.acceptance_criteria as string | undefined) ?? undefined,
      priority: (t.priority as Ticket['priority'] | undefined) ?? undefined,
      createdAt: t.created_at as string,
      workLogs: ((t.work_logs as Record<string, unknown>[]) ?? [])
        .sort((a, b) => (a.created_at as string).localeCompare(b.created_at as string))
        .map((l) => ({
          id: l.id as string,
          content: l.content as string,
          createdAt: l.created_at as string,
          author: (l.author as string | undefined) ?? undefined,
        })),
    }))

  const docs: ProjectDoc[] = ((row.docs as Record<string, unknown>[]) ?? [])
    .sort((a, b) => (a.created_at as string).localeCompare(b.created_at as string))
    .map((d) => ({
      id: d.id as string,
      projectId: row.id as string,
      title: d.title as string,
      content: (d.content as string) ?? '',
      createdAt: d.created_at as string,
      updatedAt: d.updated_at as string,
    }))

  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    currentPhase: row.current_phase as Phase,
    githubRepoUrl: (row.github_repo_url as string | undefined) ?? undefined,
    githubContext: (row.github_context as string | undefined) ?? undefined,
    conversations,
    tickets,
    docs,
  }
}

const SELECT_NESTED = `
  *,
  conversations:conversations(*, messages:messages(*)),
  tickets:tickets(*, work_logs:work_logs(*)),
  docs:project_docs(*)
`

export const supabaseAdapter: StorageAdapter = {
  async getProjects() {
    const supabase = getClient()
    const { data, error } = await supabase.from('projects').select(SELECT_NESTED).order('created_at')
    if (error) throw error
    return (data ?? []).map(rowToProject)
  },

  async getProject(id: string) {
    const supabase = getClient()
    const { data, error } = await supabase.from('projects').select(SELECT_NESTED).eq('id', id).single()
    if (error) return null
    return rowToProject(data)
  },

  async saveProject(p: Project) {
    const supabase = getClient()
    const { error } = await supabase.from('projects').upsert({
      id: p.id,
      name: p.name,
      current_phase: p.currentPhase,
      github_repo_url: p.githubRepoUrl ?? null,
      github_context: p.githubContext ?? null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    })
    if (error) throw error
  },

  async deleteProject(id: string) {
    const supabase = getClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },

  async saveConversation(projectId: string, c: Conversation) {
    const supabase = getClient()
    // Upsert conversation
    const { error: convErr } = await supabase.from('conversations').upsert({
      id: c.id,
      project_id: projectId,
      phase: c.phase,
      created_at: c.createdAt,
    })
    if (convErr) throw convErr

    // Upsert all messages
    if (c.messages.length > 0) {
      const { error: msgErr } = await supabase.from('messages').upsert(
        c.messages.map((m) => ({
          id: m.id,
          conversation_id: c.id,
          role: m.role,
          content: m.content,
          created_at: m.createdAt,
        }))
      )
      if (msgErr) throw msgErr
    }
  },

  async saveTicket(projectId: string, t: Ticket) {
    const supabase = getClient()
    const { error } = await supabase.from('tickets').insert({
      id: t.id,
      project_id: projectId,
      title: t.title,
      reason: t.reason,
      phase: t.phase,
      assigned_to: t.assignedTo ?? null,
      status: t.status,
      created_by: t.createdBy,
      context_snippet: t.contextSnippet ?? '',
      acceptance_criteria: t.acceptanceCriteria ?? null,
      priority: t.priority ?? null,
      created_at: t.createdAt,
    })
    if (error) throw error
  },

  async updateTicket(projectId: string, t: Ticket) {
    const supabase = getClient()
    const { error } = await supabase.from('tickets').upsert({
      id: t.id,
      project_id: projectId,
      title: t.title,
      reason: t.reason,
      phase: t.phase,
      assigned_to: t.assignedTo ?? null,
      status: t.status,
      created_by: t.createdBy,
      context_snippet: t.contextSnippet ?? '',
      acceptance_criteria: t.acceptanceCriteria ?? null,
      priority: t.priority ?? null,
      created_at: t.createdAt,
    })
    if (error) throw error

    // Upsert work logs
    if (t.workLogs && t.workLogs.length > 0) {
      const { error: logErr } = await supabase.from('work_logs').upsert(
        t.workLogs.map((l) => ({
          id: l.id,
          ticket_id: t.id,
          content: l.content,
          author: l.author ?? null,
          created_at: l.createdAt,
        }))
      )
      if (logErr) throw logErr
    }
  },

  async deleteTicket(_projectId: string, ticketId: string) {
    const supabase = getClient()
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId)
    if (error) throw error
  },

  async getRoles() {
    const supabase = getClient()
    const { data, error } = await supabase.from('roles').select('*').order('created_at')
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      color: r.color as string,
      createdAt: r.created_at as string,
    }))
  },

  async saveRole(r: Role) {
    const supabase = getClient()
    const { error } = await supabase.from('roles').upsert({
      id: r.id,
      name: r.name,
      color: r.color,
      created_at: r.createdAt,
    })
    if (error) throw error
  },

  async deleteRole(id: string) {
    const supabase = getClient()
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) throw error
  },

  async saveDoc(projectId: string, doc: ProjectDoc) {
    const supabase = getClient()
    const { error } = await supabase.from('project_docs').upsert({
      id: doc.id,
      project_id: projectId,
      title: doc.title,
      content: doc.content,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    })
    if (error) throw error
  },

  async deleteDoc(_projectId: string, docId: string) {
    const supabase = getClient()
    const { error } = await supabase.from('project_docs').delete().eq('id', docId)
    if (error) throw error
  },
}
