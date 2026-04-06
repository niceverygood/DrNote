import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/openai/claude-helper'

export const runtime = 'nodejs'
export const maxDuration = 30

const PARSE_CALL_PROMPT = `너는 정형외과 병원의 예약 접수 AI야.
간호사와 환자의 전화 통화 내용을 분석해서 예약 정보를 추출해줘.

오늘 날짜: {{TODAY}}

반드시 아래 JSON 형식으로만 응답해:
{
  "patient_name": "환자 이름 (없으면 빈 문자열)",
  "patient_phone": "전화번호 (없으면 빈 문자열)",
  "appointment_date": "예약 날짜 YYYY-MM-DD (내일, 다음주 등은 오늘 기준으로 계산)",
  "appointment_time": "예약 시간 HH:MM (오전 10시 → 10:00, 오후 3시 → 15:00)",
  "reason": "방문 사유 (증상이나 치료 내용, 한국어 1줄)",
  "doctor_name": "담당 의사 이름 (없으면 빈 문자열)",
  "duration_minutes": 30,
  "confidence": "high | medium | low",
  "summary": "통화 내용 한줄 요약"
}`

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript || typeof transcript !== 'string' || transcript.length < 5) {
      return NextResponse.json(
        { error: '통화 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const systemPrompt = PARSE_CALL_PROMPT.replace('{{TODAY}}', today)

    const data = await callClaudeJSON<{
      patient_name: string
      patient_phone: string
      appointment_date: string
      appointment_time: string
      reason: string
      doctor_name: string
      duration_minutes: number
      confidence: string
      summary: string
    }>({
      system: systemPrompt,
      user: `다음 전화 통화 내용에서 예약 정보를 추출해줘:\n\n${transcript}`,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Parse call error:', error)
    return NextResponse.json(
      { error: '통화 분석에 실패했습니다.' },
      { status: 500 }
    )
  }
}
