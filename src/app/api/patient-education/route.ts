import { NextRequest, NextResponse } from 'next/server'
import { openai, GPT_CONFIG } from '@/lib/openai'
import { PATIENT_EDUCATION_SYSTEM_PROMPT, PATIENT_EDUCATION_USER_PROMPT } from '@/lib/openai/prompts'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { diagnoses } = await request.json()

    if (!diagnoses || !Array.isArray(diagnoses) || diagnoses.length === 0) {
      return NextResponse.json(
        { error: '진단명이 필요합니다.' },
        { status: 400 }
      )
    }

    const response = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: PATIENT_EDUCATION_SYSTEM_PROMPT },
        { role: 'user', content: PATIENT_EDUCATION_USER_PROMPT(diagnoses) },
      ],
    })

    const responseText = response.choices[0]?.message?.content || '{}'

    let educationData
    try {
      educationData = JSON.parse(responseText)
    } catch {
      educationData = {
        title: diagnoses.join(', '),
        description: responseText,
        causes: '',
        symptoms: '',
        treatment: '',
        precautions: '',
        recovery: '',
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        title: educationData.title || diagnoses.join(', '),
        description: educationData.description || '',
        causes: educationData.causes || '',
        symptoms: educationData.symptoms || '',
        treatment: educationData.treatment || '',
        precautions: educationData.precautions || '',
        recovery: educationData.recovery || '',
      },
    })
  } catch (error) {
    console.error('Patient Education Error:', error)
    return NextResponse.json(
      { error: '환자 교육 자료 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
