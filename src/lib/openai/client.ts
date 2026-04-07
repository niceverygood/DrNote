import OpenAI from 'openai'

// Claude via OpenRouter (OpenAI 호환 형식)
let _router: OpenAI | null = null

export const router: OpenAI = new Proxy({} as OpenAI, {
  get(_, prop) {
    if (!_router) {
      _router = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://drnote.app',
          'X-Title': 'Dr.Note',
        },
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_router as any)[prop as string]
  },
})

// OpenAI 클라이언트 (Whisper STT 전용 — 현재 미사용)
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

// Claude Opus 4 via OpenRouter
export const CLAUDE_CONFIG = {
  model: 'anthropic/claude-opus-4',
  temperature: 0.3,
  max_tokens: 2000,
}

// Whisper STT 설정
export const WHISPER_CONFIG = {
  model: 'whisper-1',
  language: 'ko',
  response_format: 'verbose_json' as const,
}

// 레거시 호환
export const GPT_CONFIG = CLAUDE_CONFIG
// 레거시 호환: anthropic → router
export const anthropic = router
