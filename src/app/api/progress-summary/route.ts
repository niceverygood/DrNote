import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/openai/claude-helper'

export const runtime = 'nodejs'
export const maxDuration = 30

const PROGRESS_SYSTEM_PROMPT = `너는 정형외과 전문의야.
여러 회차에 걸친 환자의 진료 기록을 분석하여 경과 요약을 작성해줘.

반드시 아래 JSON 형식으로만 응답해:
{
  "summary": "전체 경과 요약 (3-5문장, 한국어)",
  "timeline": "치료 경과 타임라인 (날짜별 핵심 변화)",
  "improvement": "호전도 평가 (호전/유지/악화 + 근거)",
  "recommendation": "향후 치료 권고 (1-2문장)"
}`

export async function POST(request: NextRequest) {
  try {
    const { records } = await request.json()

    if (!records || !Array.isArray(records) || records.length < 2) {
      return NextResponse.json(
        { error: '최소 2개 이상의 기록이 필요합니다.' },
        { status: 400 }
      )
    }

    const recordText = records.map((r: { chart_structured?: { cc?: string; pi?: string; diagnosis?: string[]; plan?: string[] }; created_at?: string; note?: string }, i: number) => {
      const cs = r.chart_structured
      if (!cs) return ''
      return `[${i + 1}회차 - ${r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}]
CC: ${cs.cc || ''}
PI: ${cs.pi || ''}
Dx: ${(cs.diagnosis || []).join(', ')}
Plan: ${(cs.plan || []).join(', ')}
Note: ${r.note || ''}`
    }).filter(Boolean).join('\n\n')

    const data = await callClaudeJSON<{
      summary: string
      timeline: string
      improvement: string
      recommendation: string
    }>({
      system: PROGRESS_SYSTEM_PROMPT,
      user: `다음 ${records.length}회차 진료 기록의 경과를 요약해줘:\n\n${recordText}`,
      maxTokens: 1000,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Progress summary error:', error)
    return NextResponse.json(
      { error: '경과 요약 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
