import { NextRequest, NextResponse } from 'next/server'
import { openai, GPT_CONFIG } from '@/lib/openai'
import { ORTHOPEDIC_SYSTEM_PROMPT, SUMMARY_USER_PROMPT } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 30

// Clinical Report 데이터 타입
interface ClinicalData {
  chiefComplaint: string
  duration: string
  onset: string
  symptoms: {
    text: string
    severity: 'mild' | 'moderate' | 'severe'
  }[]
  history: {
    type: 'trauma' | 'surgery' | 'disease' | 'medication'
    text: string
    date?: string
  }[]
  findings: {
    name: string
    result: 'positive' | 'negative' | 'normal' | 'abnormal'
    value?: string
  }[]
  diagnosis: {
    primary: string
    differential?: string[]
  }
  plan: {
    type: 'test' | 'medication' | 'procedure' | 'referral' | 'followup'
    text: string
    priority?: 'routine' | 'urgent' | 'stat'
  }[]
  keywords: string[]
}

interface SummaryResponse {
  success: boolean
  clinicalData: ClinicalData
  transcript: string
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

    // GPT-4o로 Clinical Report JSON 생성
    const summaryResponse = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: GPT_CONFIG.temperature,
      max_tokens: GPT_CONFIG.max_tokens,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: ORTHOPEDIC_SYSTEM_PROMPT },
        { role: 'user', content: SUMMARY_USER_PROMPT(transcript) },
      ],
    })

    const responseText = summaryResponse.choices[0]?.message?.content || '{}'

    // JSON 파싱
    let clinicalData: ClinicalData
    try {
      clinicalData = JSON.parse(responseText)
    } catch {
      // JSON 파싱 실패 시 기본 구조 반환
      clinicalData = createDefaultClinicalData(responseText)
    }

    // 데이터 검증 및 기본값 설정
    clinicalData = validateAndFillDefaults(clinicalData)

    const response: SummaryResponse = {
      success: true,
      clinicalData,
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

function createDefaultClinicalData(rawText: string): ClinicalData {
  return {
    chiefComplaint: 'Unable to parse',
    duration: 'N/A',
    onset: 'N/A',
    symptoms: [],
    history: [],
    findings: [],
    diagnosis: {
      primary: rawText.substring(0, 100) || 'Unable to determine',
    },
    plan: [],
    keywords: [],
  }
}

function validateAndFillDefaults(data: ClinicalData): ClinicalData {
  return {
    chiefComplaint: data.chiefComplaint || 'N/A',
    duration: data.duration || 'N/A',
    onset: data.onset || 'N/A',
    symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
    history: Array.isArray(data.history) ? data.history : [],
    findings: Array.isArray(data.findings) ? data.findings : [],
    diagnosis: {
      primary: data.diagnosis?.primary || 'N/A',
      differential: Array.isArray(data.diagnosis?.differential) ? data.diagnosis.differential : [],
    },
    plan: Array.isArray(data.plan) ? data.plan : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
  }
}
