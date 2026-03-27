import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { openai, GPT_CONFIG } from '@/lib/openai'
import { DEFAULT_MEDICAL_TERMS, buildDictionaryPrompt } from '@/lib/medical-dictionary'
import { buildSystemPrompt, SUMMARY_USER_PROMPT } from '@/lib/openai/prompts'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 응답 타입
interface ChartResponse {
  chart: string
  note: string
  keywords: string[]
}

interface SummaryResponse {
  success: boolean
  data: ChartResponse
  transcript: string
}

// DB에서 의학 용어 사전 가져오기 (없으면 로컬 사전 사용)
async function getMedicalDictionary(): Promise<string> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('medical_terms')
        .select('abbreviation, full_name, korean_name')
        .eq('is_active', true)
        .order('abbreviation')

      if (!error && data && data.length > 0) {
        const dictLines = data.map(term => {
          const korean = term.korean_name ? ` (${term.korean_name})` : ''
          return `- ${term.abbreviation}: ${term.full_name}${korean}`
        })
        return dictLines.join('\n')
      }
    }

    return buildDictionaryPrompt(DEFAULT_MEDICAL_TERMS)
  } catch (error) {
    console.error('Dictionary fetch error:', error)
    return buildDictionaryPrompt(DEFAULT_MEDICAL_TERMS)
  }
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

    if (transcript.length < 5) {
      return NextResponse.json(
        { error: '텍스트가 너무 짧습니다.' },
        { status: 400 }
      )
    }

    // DB에서 의학 용어 사전 가져오기
    const dictionary = await getMedicalDictionary()
    const systemPrompt = buildSystemPrompt(dictionary)

    // GPT-4o로 차트 생성
    const summaryResponse = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: SUMMARY_USER_PROMPT(transcript) },
      ],
    })

    const responseText = summaryResponse.choices[0]?.message?.content || '{}'

    // JSON 파싱
    let chartData: ChartResponse
    try {
      chartData = JSON.parse(responseText)
    } catch {
      chartData = {
        chart: responseText,
        note: '',
        keywords: [],
      }
    }

    // 데이터 검증
    chartData = {
      chart: chartData.chart || 'Unable to parse',
      note: chartData.note || '',
      keywords: Array.isArray(chartData.keywords) ? chartData.keywords : [],
    }

    const response: SummaryResponse = {
      success: true,
      data: chartData,
      transcript,
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
