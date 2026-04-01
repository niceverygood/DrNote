import { NextRequest, NextResponse } from 'next/server'
import { openai, GPT_CONFIG } from '@/lib/openai'
import { TRANSLATE_SYSTEM_PROMPT, TRANSLATE_USER_PROMPT } from '@/lib/openai/prompts'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { chart, note, language } = await request.json()

    if (!chart || !language) {
      return NextResponse.json(
        { error: '차트와 언어가 필요합니다.' },
        { status: 400 }
      )
    }

    const chartWithNote = { ...chart, note: note || '' }

    const response = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: TRANSLATE_SYSTEM_PROMPT },
        { role: 'user', content: TRANSLATE_USER_PROMPT(chartWithNote, language) },
      ],
    })

    const responseText = response.choices[0]?.message?.content || '{}'

    let translationData
    try {
      translationData = JSON.parse(responseText)
    } catch {
      translationData = {
        translated_cc: '',
        translated_pi: '',
        translated_diagnosis: '',
        translated_plan: '',
        translated_note: responseText,
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        translated_cc: translationData.translated_cc || '',
        translated_pi: translationData.translated_pi || '',
        translated_diagnosis: translationData.translated_diagnosis || '',
        translated_plan: translationData.translated_plan || '',
        translated_note: translationData.translated_note || '',
      },
      language,
    })
  } catch (error) {
    console.error('Translate Error:', error)
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
