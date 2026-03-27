import OpenAI from 'openai'

// OpenAI 클라이언트 (서버에서만 사용)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Whisper STT 설정
export const WHISPER_CONFIG = {
  model: 'whisper-1',
  language: 'ko', // 한국어 우선
  response_format: 'verbose_json' as const,
}

// GPT-4o 요약 설정
export const GPT_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.3, // 일관된 의료 용어 사용을 위해 낮은 temperature
  max_tokens: 2000,
}
