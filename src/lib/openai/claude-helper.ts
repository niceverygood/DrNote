import { openai, GPT_CONFIG } from './client'

interface ClaudeMessageOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

/**
 * GPT-4o 호출 후 텍스트 응답 반환
 */
export async function callClaude(options: ClaudeMessageOptions): Promise<string> {
  const response = await openai.chat.completions.create({
    model: GPT_CONFIG.model,
    max_tokens: options.maxTokens || GPT_CONFIG.max_tokens,
    temperature: options.temperature ?? GPT_CONFIG.temperature,
    messages: [
      { role: 'system', content: options.system },
      { role: 'user', content: options.user },
    ],
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * GPT-4o 호출 후 JSON 파싱하여 반환
 */
export async function callClaudeJSON<T = Record<string, unknown>>(options: ClaudeMessageOptions): Promise<T> {
  const response = await openai.chat.completions.create({
    model: GPT_CONFIG.model,
    max_tokens: options.maxTokens || GPT_CONFIG.max_tokens,
    temperature: options.temperature ?? GPT_CONFIG.temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: options.system + '\n\n반드시 유효한 JSON만 출력해.' },
      { role: 'user', content: options.user },
    ],
  })

  const text = response.choices[0]?.message?.content || '{}'
  return JSON.parse(text) as T
}

/**
 * GPT-4o Vision 호출 (이미지 분석)
 */
export async function callClaudeVision(options: {
  system: string
  userText: string
  imageBase64: string
  mimeType: string
  maxTokens?: number
}): Promise<string> {
  const response = await openai.chat.completions.create({
    model: GPT_CONFIG.model,
    max_tokens: options.maxTokens || GPT_CONFIG.max_tokens,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: options.system },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${options.mimeType};base64,${options.imageBase64}`,
              detail: 'high',
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

  return response.choices[0]?.message?.content || ''
}
