import { NextRequest, NextResponse } from 'next/server'
import { openai, GPT_CONFIG } from '@/lib/openai'
import { ORTHOPEDIC_SYSTEM_PROMPT, SUMMARY_USER_PROMPT, KEYWORDS_PROMPT } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

interface SoapNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SummaryResponse {
  success: boolean
  soap: SoapNote
  keywords: string[]
  rawResponse: string
}

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    if (transcript.length < 10) {
      return NextResponse.json(
        { error: '텍스트가 너무 짧습니다.' },
        { status: 400 }
      )
    }

    // GPT-4o로 SOAP 요약 생성
    const summaryResponse = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: GPT_CONFIG.temperature,
      max_tokens: GPT_CONFIG.max_tokens,
      messages: [
        { role: 'system', content: ORTHOPEDIC_SYSTEM_PROMPT },
        { role: 'user', content: SUMMARY_USER_PROMPT(transcript) },
      ],
    })

    const summaryText = summaryResponse.choices[0]?.message?.content || ''

    // SOAP 섹션 파싱
    const soap = parseSoapNote(summaryText)

    // 키워드 추출
    const keywordsResponse = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: 0,
      max_tokens: 500,
      messages: [
        { role: 'system', content: ORTHOPEDIC_SYSTEM_PROMPT },
        { role: 'user', content: SUMMARY_USER_PROMPT(transcript) },
        { role: 'assistant', content: summaryText },
        { role: 'user', content: KEYWORDS_PROMPT },
      ],
    })

    const keywordsText = keywordsResponse.choices[0]?.message?.content || '[]'
    const keywords = parseKeywords(keywordsText)

    const response: SummaryResponse = {
      success: true,
      soap,
      keywords,
      rawResponse: summaryText,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Summarize Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `요약 실패: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '요약 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

function parseSoapNote(text: string): SoapNote {
  const sections: SoapNote = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  }

  // 각 섹션 추출
  const subjectiveMatch = text.match(
    /\[S\s*-?\s*Subjective\]\s*\n?([\s\S]*?)(?=\[O\s*-?\s*Objective\]|$)/i
  )
  const objectiveMatch = text.match(
    /\[O\s*-?\s*Objective\]\s*\n?([\s\S]*?)(?=\[A\s*-?\s*Assessment\]|$)/i
  )
  const assessmentMatch = text.match(
    /\[A\s*-?\s*Assessment\]\s*\n?([\s\S]*?)(?=\[P\s*-?\s*Plan\]|$)/i
  )
  const planMatch = text.match(/\[P\s*-?\s*Plan\]\s*\n?([\s\S]*?)$/i)

  if (subjectiveMatch) sections.subjective = subjectiveMatch[1].trim()
  if (objectiveMatch) sections.objective = objectiveMatch[1].trim()
  if (assessmentMatch) sections.assessment = assessmentMatch[1].trim()
  if (planMatch) sections.plan = planMatch[1].trim()

  return sections
}

function parseKeywords(text: string): string[] {
  try {
    // JSON 배열 추출
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      return JSON.parse(match[0])
    }
  } catch {
    // JSON 파싱 실패 시 쉼표로 분리
    return text
      .replace(/[\[\]"]/g, '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  }
  return []
}
