import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSON } from '@/lib/openai/claude-helper'
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

    const educationData = await callClaudeJSON<{
      title?: string
      description?: string
      causes?: string
      symptoms?: string
      treatment?: string
      precautions?: string
      recovery?: string
    }>({
      system: PATIENT_EDUCATION_SYSTEM_PROMPT,
      user: PATIENT_EDUCATION_USER_PROMPT(diagnoses),
      temperature: 0.4,
      maxTokens: 1500,
    })

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
