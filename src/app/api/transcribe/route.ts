import { NextRequest, NextResponse } from 'next/server'
import { openai, WHISPER_CONFIG } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60초 타임아웃

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: '오디오 파일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (25MB 제한 - Whisper API 제한)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 25MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // Whisper API 호출
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: WHISPER_CONFIG.model,
      language: WHISPER_CONFIG.language,
      response_format: WHISPER_CONFIG.response_format,
    })

    return NextResponse.json({
      success: true,
      text: transcription.text,
      duration: transcription.duration,
      segments: transcription.segments,
    })
  } catch (error) {
    console.error('STT Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `STT 변환 실패: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'STT 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
