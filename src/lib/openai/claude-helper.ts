import { anthropic, CLAUDE_CONFIG } from './client'

interface ClaudeMessageOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

/**
 * Claude API 호출 후 텍스트 응답 반환
 */
export async function callClaude(options: ClaudeMessageOptions): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_CONFIG.model,
    max_tokens: options.maxTokens || CLAUDE_CONFIG.max_tokens,
    temperature: options.temperature ?? CLAUDE_CONFIG.temperature,
    system: options.system,
    messages: [
      { role: 'user', content: options.user },
    ],
  })

  const block = response.content[0]
  if (block.type === 'text') {
    return block.text
  }
  return ''
}

/**
 * Claude API 호출 후 JSON 파싱하여 반환
 */
export async function callClaudeJSON<T = Record<string, unknown>>(options: ClaudeMessageOptions): Promise<T> {
  const text = await callClaude({
    ...options,
    system: options.system + '\n\n반드시 유효한 JSON만 출력해. 다른 텍스트는 절대 포함하지 마.',
  })

  // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text

  return JSON.parse(jsonStr.trim()) as T
}

/**
 * Claude Vision API 호출 (이미지 분석)
 */
export async function callClaudeVision(options: {
  system: string
  userText: string
  imageBase64: string
  mimeType: string
  maxTokens?: number
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_CONFIG.model,
    max_tokens: options.maxTokens || CLAUDE_CONFIG.max_tokens,
    temperature: 0.2,
    system: options.system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: options.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: options.imageBase64,
            },
          },
          {
            type: 'text',
            text: options.userText,
          },
        ],
      },
    ],
  })

  const block = response.content[0]
  if (block.type === 'text') {
    return block.text
  }
  return ''
}
