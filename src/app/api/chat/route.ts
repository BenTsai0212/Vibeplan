import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { Phase, Message } from '@/types'
import { PHASE_PROMPTS } from '@/lib/agents/prompts'

interface PriorPhaseContext {
  phase: Phase
  messages: Message[]
}

function buildSystemPrompt(
  phase: Phase,
  githubContext?: string,
  priorPhaseContext?: PriorPhaseContext[]
): string {
  const PHASE_NAMES: Record<Phase, string> = {
    research: 'Research（釐清想法）',
    plan: 'Plan（規劃架構）',
    execute: 'Execute（實作）',
    review: 'Review（審查）',
  }

  let prompt = PHASE_PROMPTS[phase]

  if (githubContext) {
    prompt += `\n\n## 專案 GitHub 資訊
以下是用戶專案的 GitHub 資訊，包含 README、最近的 commits 和 open issues。
請在分析和回應時主動參考這份資訊，例如：提到具體的檔案結構、引用 README 的說明、根據 commit 歷史推測開發狀態。
${githubContext}`
  }

  if (priorPhaseContext && priorPhaseContext.length > 0) {
    const sections = priorPhaseContext
      .filter((c) => c.messages.length > 0)
      .map(({ phase: p, messages }) => {
        const lines = messages
          .map((m) => `${m.role === 'user' ? '【用戶】' : '【Agent】'} ${m.content}`)
          .join('\n')
        return `### ${PHASE_NAMES[p]} 的對話記錄\n${lines}`
      })

    if (sections.length > 0) {
      prompt += `\n\n## 其他階段的對話記錄（背景資訊）
以下是用戶在其他階段與 Agent 的對話，讓你了解整個專案的來龍去脈。請在回應時自然地引用這些背景，不需要重複總結它們。
${sections.join('\n\n')}`
    }
  }

  return prompt
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY 未設定' }), { status: 500 })
  }

  const { phase, messages, githubContext, priorPhaseContext }: {
    phase: Phase
    messages: Message[]
    githubContext?: string
    priorPhaseContext?: PriorPhaseContext[]
  } = await req.json()

  const systemPrompt = buildSystemPrompt(phase, githubContext, priorPhaseContext)

  const client = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        })

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : '串流失敗'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
