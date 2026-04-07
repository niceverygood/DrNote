import OpenAI from 'openai'

// OpenAI 클라이언트 (GPT-4o + Whisper)
let _openai: OpenAI | null = null

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_, prop) {
    if (!_openai) {
      _openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_openai as any)[prop as string]
  },
})

// GPT-4o 설정
export const GPT_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.3,
  max_tokens: 2000,
}

// Whisper STT 설정
export const WHISPER_CONFIG = {
  model: 'whisper-1',
  language: 'ko',
  response_format: 'verbose_json' as const,
}

// 호환용 alias
export const CLAUDE_CONFIG = GPT_CONFIG
export const router = openai
export const anthropic = openai
