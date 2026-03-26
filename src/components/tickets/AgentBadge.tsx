import type { AgentId } from '@/types'

const AGENT_COLORS: Record<AgentId, string> = {
  fe: '#60a5fa',
  be: '#4ade80',
  ux: '#fbbf24',
  pm: '#a78bfa',
}

const AGENT_LABELS: Record<AgentId, string> = {
  fe: 'Frontend',
  be: 'Backend',
  ux: 'UX',
  pm: 'PM',
}

export function AgentBadge({ agentId }: { agentId: AgentId }) {
  const color = AGENT_COLORS[agentId]
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium"
      style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
    >
      {AGENT_LABELS[agentId]}
    </span>
  )
}
