import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { Phase, Message } from '@/types'
import { PHASE_PROMPTS } from '@/lib/agents/prompts'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY 未設定' }), { status: 500 })
  }

  const { phase, messages, githubContext }: {
    phase: Phase
    messages: Message[]
    githubContext?: string
  } = await req.json()

  const systemPrompt = githubContext
    ? `${PHASE_PROMPTS[phase]}\n\n## 專案 GitHub Context\n${githubContext}`
    : PHASE_PROMPTS[phase]

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
