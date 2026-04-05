import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callClaudeJSON } from '@/lib/openai/claude-helper'
import { DEFAULT_MEDICAL_TERMS, buildDictionaryPrompt } from '@/lib/medical-dictionary'
import { buildSystemPrompt, SUMMARY_USER_PROMPT } from '@/lib/openai/prompts'
import type { ChartResponse, ConsultationType } from '@/types/database'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

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
    const { transcript, consultation_type = 'initial', chart_format, previous_records } = await request.json()

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

    const validType: ConsultationType = consultation_type === 'follow_up' ? 'follow_up' : 'initial'

    // DB에서 의학 용어 사전 가져오기
    const dictionary = await getMedicalDictionary()
    const systemPrompt = buildSystemPrompt(dictionary, validType, chart_format || undefined)

    // 이전 기록 컨텍스트 구성
    let userPrompt = SUMMARY_USER_PROMPT(transcript)
    if (previous_records && Array.isArray(previous_records) && previous_records.length > 0) {
      const prevContext = previous_records.map((r: { chart_structured?: { cc?: string; pi?: string; diagnosis?: string[]; plan?: string[] }; created_at?: string }, i: number) => {
        const cs = r.chart_structured
        if (!cs) return ''
        return `[${i + 1}회차 - ${r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}]
CC: ${cs.cc || ''}
PI: ${cs.pi || ''}
Dx: ${(cs.diagnosis || []).join(', ')}
Plan: ${(cs.plan || []).join(', ')}`
      }).filter(Boolean).join('\n\n')

      userPrompt = `## 이전 진료 기록 (참고)\n${prevContext}\n\n## 오늘 진료 대화\n${transcript}\n\n위 이전 기록을 참고하여 오늘 진료 내용을 차트로 변환해줘. PI에 이전 치료 대비 변화를 반영해줘.`
    }

    // Claude Opus 4.6으로 차트 생성
    let chartData: ChartResponse
    try {
      const parsed = await callClaudeJSON<{
        chart?: { cc?: string; pi?: string; diagnosis?: string[]; plan?: string[] }
        note?: string
        keywords?: string[]
        consultation_type?: string
        counselor_summary?: { explanation?: string; treatment_reason?: string; treatment_items?: string[] }
      }>({
        system: systemPrompt,
        user: userPrompt,
      })

      chartData = {
        chart: {
          cc: parsed.chart?.cc || '',
          pi: parsed.chart?.pi || '',
          diagnosis: Array.isArray(parsed.chart?.diagnosis) ? parsed.chart.diagnosis : [],
          plan: Array.isArray(parsed.chart?.plan) ? parsed.chart.plan : [],
        },
        note: parsed.note || '',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        consultation_type: parsed.consultation_type === 'follow_up' ? 'follow_up' : 'initial',
        counselor_summary: {
          explanation: parsed.counselor_summary?.explanation || '',
          treatment_reason: parsed.counselor_summary?.treatment_reason || '',
          treatment_items: Array.isArray(parsed.counselor_summary?.treatment_items)
            ? parsed.counselor_summary.treatment_items
            : [],
        },
      }
    } catch {
      chartData = {
        chart: { cc: '', pi: '', diagnosis: [], plan: [] },
        note: '',
        keywords: [],
        consultation_type: validType,
        counselor_summary: { explanation: '', treatment_reason: '', treatment_items: [] },
      }
    }

    // 레거시 호환: chart를 문자열로도 생성
    const chartText = [
      chartData.chart.cc,
      '',
      chartData.chart.pi,
      '',
      ...chartData.chart.diagnosis,
      'P>',
      ...chartData.chart.plan.map(p => `- ${p}`),
    ].join('\n')

    return NextResponse.json({
      success: true,
      data: {
        chart: chartText,
        chart_structured: chartData.chart,
        note: chartData.note,
        keywords: chartData.keywords,
        consultation_type: chartData.consultation_type,
        counselor_summary: chartData.counselor_summary,
      },
      transcript,
    })
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
