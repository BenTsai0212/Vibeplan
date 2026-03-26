import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { PMAnalyzeRequest, PMAnalyzeResponse, Role } from '@/types'

function buildSystemPrompt(roles: Role[]): string {
  const roleList = roles.map((r) => `- ${r.name}`).join('\n')
  return `你是一位資深產品經理，負責分析專案進度並規劃工作分配。

任務：
1. 讀取「專案對話記錄」和「現有 tickets」
2. 找出目前缺少的工作
3. 為每個新工作寫清楚的 ticket，決定 assign 給哪個角色

可 assign 的角色（只能使用以下名稱，完全一致）：
${roleList}

回應格式（只回傳 JSON，不要其他文字）：
{
  "thinking": "分析思路（中文，2-4句）",
  "tickets": [
    {
      "title": "ticket 標題",
      "reason": "為什麼需要（一句話）",
      "assignTo": "角色名稱（必須是上方清單中的其中一個）",
      "priority": "high | medium | low"
    }
  ]
}`
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 未設定' }, { status: 500 })
  }

  const body: PMAnalyzeRequest = await req.json()
  const { conversations, tickets, roles } = body

  if (!conversations || conversations.length === 0) {
    return NextResponse.json(
      { thinking: '目前沒有對話記錄，無法分析。', tickets: [] } satisfies PMAnalyzeResponse
    )
  }

  const client = new Anthropic({ apiKey })

  const userContent = `請分析以下專案的對話記錄和現有 tickets，提出新的工作建議。

專案對話記錄：
${JSON.stringify(conversations, null, 2)}

現有 tickets：
${JSON.stringify(tickets, null, 2)}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: buildSystemPrompt(roles ?? []),
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = (message.content[0] as { text: string }).text

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'PM 回應格式錯誤' }, { status: 500 })
    }

    const parsed: PMAnalyzeResponse = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知錯誤'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
