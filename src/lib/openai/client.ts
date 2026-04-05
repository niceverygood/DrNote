import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Claude 클라이언트 (차트 생성, 번역, 교육, 영상 분석, 경과 요약)
let _anthropic: Anthropic | null = null

export const anthropic: Anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    if (!_anthropic) {
      _anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_anthropic as any)[prop as string]
  },
})

// OpenAI 클라이언트 (Whisper STT 전용)
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

// Claude Opus 4.6 설정
export const CLAUDE_CONFIG = {
  model: 'claude-opus-4-6',
  temperature: 0.3,
  max_tokens: 2000,
}

// Whisper STT 설정 (OpenAI 유지)
export const WHISPER_CONFIG = {
  model: 'whisper-1',
  language: 'ko',
  response_format: 'verbose_json' as const,
}

// 레거시 호환: GPT_CONFIG는 CLAUDE_CONFIG로 매핑
export const GPT_CONFIG = CLAUDE_CONFIG
