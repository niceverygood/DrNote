import { NextRequest, NextResponse } from 'next/server'
import { callClaudeVision } from '@/lib/openai/claude-helper'

export const runtime = 'nodejs'
export const maxDuration = 60

type AnalysisType = 'bone_age' | 'spine_alignment' | 'knee_alignment' | 'general'

const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  bone_age: `너는 소아정형외과 영상의학 전문의야.
이 손/손목 X-ray 영상을 분석해서 골연령(Bone Age)을 평가해줘.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만 출력해:
{
  "analysis_type": "bone_age",
  "findings": {
    "estimated_bone_age": "추정 골연령 (예: 13세 2개월)",
    "chronological_age_comparison": "실제 나이 대비 평가 (진행/정상/지연)",
    "skeletal_maturity": "골성숙도 평가",
    "key_observations": ["주요 소견 1", "주요 소견 2"],
    "greulich_pyle_assessment": "Greulich-Pyle 기준 평가"
  },
  "measurements": {
    "bone_age_years": 13.2,
    "confidence": "high/medium/low"
  },
  "patient_explanation": "환자/보호자에게 설명할 수 있는 쉬운 한국어 설명 (3-4문장)",
  "clinical_note": "차트에 기재할 간결한 영문 소견"
}`,

  spine_alignment: `너는 척추 전문 정형외과 영상의학 전문의야.
이 척추 X-ray 영상을 분석해서 정렬(Alignment) 상태와 주요 각도를 측정해줘.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만 출력해:
{
  "analysis_type": "spine_alignment",
  "findings": {
    "overall_alignment": "전체적인 척추 정렬 평가",
    "scoliosis": "측만증 유무 및 정도",
    "kyphosis": "후만증 평가",
    "lordosis": "전만 상태 평가",
    "key_observations": ["주요 소견 1", "주요 소견 2"],
    "disc_space": "디스크 간격 이상 소견"
  },
  "measurements": {
    "cobb_angle": { "value": "각도", "location": "위치", "severity": "정상/경도/중등도/중증" },
    "lumbar_lordosis": { "value": "각도", "normal_range": "정상 범위" },
    "thoracic_kyphosis": { "value": "각도", "normal_range": "정상 범위" },
    "sva": { "value": "mm", "normal_range": "정상 범위" }
  },
  "patient_explanation": "환자에게 설명할 수 있는 쉬운 한국어 설명 (3-4문장)",
  "clinical_note": "차트에 기재할 간결한 영문 소견"
}`,

  knee_alignment: `너는 무릎 전문 정형외과 영상의학 전문의야.
이 무릎/하지 X-ray 영상을 분석해서 정렬(Alignment) 상태와 주요 각도를 측정해줘.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만 출력해:
{
  "analysis_type": "knee_alignment",
  "findings": {
    "overall_alignment": "전체적인 하지 정렬 평가",
    "valgus_varus": "외반/내반 평가",
    "joint_space": "관절 간격 평가",
    "osteophytes": "골극 유무",
    "key_observations": ["주요 소견 1", "주요 소견 2"],
    "kl_grade": "Kellgren-Lawrence 등급 (0-4)"
  },
  "measurements": {
    "mechanical_axis": { "value": "각도/mm", "deviation": "내측/외측" },
    "anatomical_tfa": { "value": "각도", "normal_range": "170-175도" },
    "joint_line_angle": { "value": "각도" }
  },
  "patient_explanation": "환자에게 설명할 수 있는 쉬운 한국어 설명 (3-4문장)",
  "clinical_note": "차트에 기재할 간결한 영문 소견"
}`,

  general: `너는 정형외과 영상의학 전문의야.
이 X-ray/영상을 분석해서 정형외과적으로 의미있는 소견을 찾아줘.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만 출력해:
{
  "analysis_type": "general",
  "findings": {
    "body_part": "촬영 부위",
    "overall_impression": "전체적인 인상",
    "abnormalities": ["이상 소견 1", "이상 소견 2"],
    "normal_findings": ["정상 소견 1"],
    "key_observations": ["주요 관찰 1", "주요 관찰 2"]
  },
  "measurements": {},
  "patient_explanation": "환자에게 설명할 수 있는 쉬운 한국어 설명 (3-4문장)",
  "clinical_note": "차트에 기재할 간결한 영문 소견"
}`,
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const analysisType = (formData.get('analysis_type') as AnalysisType) || 'general'
    const patientAge = formData.get('patient_age') as string | null

    if (!imageFile) {
      return NextResponse.json({ error: '영상 파일이 필요합니다.' }, { status: 400 })
    }

    if (imageFile.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 20MB 이하여야 합니다.' }, { status: 400 })
    }

    // 이미지를 base64로 변환
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    // 프롬프트 구성
    let systemPrompt = ANALYSIS_PROMPTS[analysisType] || ANALYSIS_PROMPTS.general
    if (patientAge) {
      systemPrompt += `\n\n환자 나이: ${patientAge}세 (이 정보를 분석에 참고해줘)`
    }

    // Claude Opus 4.6 Vision으로 영상 분석
    const responseText = await callClaudeVision({
      system: systemPrompt,
      userText: '이 영상을 분석해줘.',
      imageBase64: base64,
      mimeType,
      maxTokens: 2000,
    })

    let analysisData
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/) || responseText.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText
      analysisData = JSON.parse(jsonStr.trim())
    } catch {
      analysisData = {
        analysis_type: analysisType,
        findings: { overall_impression: responseText, key_observations: [] },
        measurements: {},
        patient_explanation: '',
        clinical_note: '',
      }
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
    })
  } catch (error) {
    console.error('Image Analysis Error:', error)
    return NextResponse.json(
      { error: '영상 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
