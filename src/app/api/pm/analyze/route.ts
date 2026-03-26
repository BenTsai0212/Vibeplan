import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { PMAnalyzeRequest, PMAnalyzeResponse } from '@/types'
import { PM_SYSTEM_PROMPT } from '@/lib/agents/prompts'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 未設定' }, { status: 500 })
  }

  const body: PMAnalyzeRequest = await req.json()
  const { conversations, tickets } = body

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
      system: PM_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = (message.content[0] as { text: string }).text

    // Extract JSON even if Claude wraps it in markdown code blocks
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
