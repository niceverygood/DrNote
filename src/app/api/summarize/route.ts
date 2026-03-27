import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { openai, GPT_CONFIG } from '@/lib/openai'
import { DEFAULT_MEDICAL_TERMS, buildDictionaryPrompt } from '@/lib/medical-dictionary'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

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
        // DB 데이터를 프롬프트 형식으로 변환
        const dictLines = data.map(term => {
          const korean = term.korean_name ? ` (${term.korean_name})` : ''
          return `- ${term.abbreviation}: ${term.full_name}${korean}`
        })
        return dictLines.join('\n')
      }
    }

    // 로컬 기본 사전 사용
    return buildDictionaryPrompt(DEFAULT_MEDICAL_TERMS)
  } catch (error) {
    console.error('Dictionary fetch error:', error)
    return buildDictionaryPrompt(DEFAULT_MEDICAL_TERMS)
  }
}

function buildSystemPrompt(dictionary: string): string {
  return `너는 10년 차 숙련된 정형외과 전문의이자 의료 기록가야.
환자와 의사의 대화 텍스트를 분석하여 구조화된 임상 리포트를 JSON 형식으로 작성해줘.

## 의학 용어 사전 (반드시 이 약어들을 활용해)
${dictionary}

## 출력 형식 (JSON)
반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 순수 JSON만 출력해:

{
  "chiefComplaint": "주호소 (의학 약어 사용, 예: Lt. knee pain)",
  "duration": "증상 기간 (예: 3주, 2개월)",
  "onset": "발병 원인/계기 (예: 외상, 점진적 발생)",
  "symptoms": [
    { "text": "증상 설명", "severity": "mild|moderate|severe" }
  ],
  "history": [
    { "type": "trauma|surgery|disease|medication", "text": "병력 내용", "date": "시점 (선택)" }
  ],
  "findings": [
    { "name": "검사명", "result": "positive|negative|normal|abnormal", "value": "추가 설명 (선택)" }
  ],
  "diagnosis": {
    "primary": "주 진단명 (의학 약어 사용)",
    "differential": ["감별 진단 1", "감별 진단 2"]
  },
  "plan": [
    { "type": "test|medication|procedure|referral|followup", "text": "계획 내용", "priority": "routine|urgent|stat" }
  ],
  "keywords": ["핵심 의학 키워드 배열 - 위 사전의 약어 우선 사용"]
}

## 중요 규칙
1. 위 사전에 있는 약어를 최대한 활용해서 전문적으로 작성
2. 일반 언어를 의학 용어로 변환 (예: "허리 디스크" → "L-spine HNP")
3. 부위를 명확히 표기 (예: "C5-6", "L4-5", "Rt. knee", "Lt. shoulder")
4. 검사 결과는 positive/negative로 명확히 표기
5. 긴급한 검사나 처치는 priority를 "urgent" 또는 "stat"으로 표시
6. keywords에는 사전에 있는 약어를 우선적으로 포함
7. 반드시 유효한 JSON만 출력 (마크다운 코드블록 없이)
`
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

    // DB에서 의학 용어 사전 가져오기
    const dictionary = await getMedicalDictionary()
    const systemPrompt = buildSystemPrompt(dictionary)

    // GPT-4o로 Clinical Report JSON 생성
    const summaryResponse = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: GPT_CONFIG.temperature,
      max_tokens: GPT_CONFIG.max_tokens,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `다음은 정형외과 진료 대화 내용이야. 위 JSON 형식으로 분석해줘.\n\n---\n${transcript}\n---` },
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
