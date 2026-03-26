'use client'

import { useAppStore } from '@/store/appStore'

export function AgentBadge({ agentId }: { agentId: string }) {
  const roles = useAppStore((s) => s.roles)
  const role = roles.find((r) => r.id === agentId)

  const color = role?.color ?? '#71717a'
  const label = role?.name ?? '?'

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium"
      style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  )
}
