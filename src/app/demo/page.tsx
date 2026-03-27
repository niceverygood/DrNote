'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AudioRecorder } from '@/components/audio'
import { ClinicalReport, type ClinicalData } from '@/components/ClinicalReport'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'done' | 'error'

interface ProcessingState {
  step: ProcessingStep
  progress: number
  transcript: string
  clinicalData: ClinicalData | null
  error: string
}

const initialState: ProcessingState = {
  step: 'idle',
  progress: 0,
  transcript: '',
  clinicalData: null,
  error: '',
}

const stepMessages: Record<ProcessingStep, string> = {
  idle: '',
  uploading: '오디오 업로드 중...',
  transcribing: 'Whisper AI가 음성을 분석하고 있습니다',
  summarizing: 'GPT-4o가 임상 리포트를 생성하고 있습니다',
  done: '분석 완료',
  error: '오류 발생',
}

export default function DemoPage() {
  const [state, setState] = useState<ProcessingState>(initialState)

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setState({ ...initialState, step: 'uploading', progress: 10 })

    try {
      setState((s) => ({ ...s, step: 'transcribing', progress: 30 }))

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const sttResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!sttResponse.ok) {
        const error = await sttResponse.json()
        throw new Error(error.error || 'STT 변환 실패')
      }

      const sttResult = await sttResponse.json()
      const transcript = sttResult.text

      setState((s) => ({ ...s, transcript, progress: 60 }))
      setState((s) => ({ ...s, step: 'summarizing', progress: 70 }))

      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })

      if (!summaryResponse.ok) {
        const error = await summaryResponse.json()
        throw new Error(error.error || '요약 실패')
      }

      const summaryResult = await summaryResponse.json()

      setState({
        step: 'done',
        progress: 100,
        transcript,
        clinicalData: summaryResult.clinicalData,
        error: '',
      })

      toast.success('AI 분석이 완료되었습니다')
    } catch (error) {
      console.error('Processing error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [])

  // 샘플 데모 실행
  const runSampleDemo = useCallback(async () => {
    const sampleTranscript = `환자분 안녕하세요. 왼쪽 무릎이 3주 전부터 아프시다고 하셨죠?
네, 축구하다가 넘어졌어요. 그때부터 계속 아프고, 계단 오르내릴 때 특히 심해요.
붓기도 가끔 있고요.
알겠습니다. 한번 검사해볼게요. 여기 누르면 아프세요? 네, 안쪽이 아파요.
무릎 굽혔다 펴는 건 괜찮으시고요? 네, 그건 괜찮아요.
맥머레이 테스트 해볼게요. 여기 돌릴 때 소리나거나 아프면 말씀해주세요.
아, 거기 아파요. 딱 소리도 나는 것 같아요.
네, 반월판 손상이 의심됩니다. MRI 찍어보시는 게 좋겠어요.
일단 소염진통제 처방해드릴게요. 셀레브렉스 200mg 하루 두 번 드시고,
얼음찜질하시고 압박붕대 감아두세요. 2주 후에 MRI 결과 가지고 다시 오세요.`

    setState({ ...initialState, step: 'summarizing', progress: 50 })

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: sampleTranscript }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '요약 실패')
      }

      const result = await response.json()

      setState({
        step: 'done',
        progress: 100,
        transcript: sampleTranscript,
        clinicalData: result.clinicalData,
        error: '',
      })

      toast.success('샘플 데모 분석 완료!')
    } catch (error) {
      console.error('Demo error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [])

  const isProcessing = state.step !== 'idle' && state.step !== 'done' && state.step !== 'error'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Dr.Note</h1>
              <p className="text-xs text-gray-400">AI Clinical Report Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Processing Status */}
        {isProcessing && (
          <div className="card-elevated p-6 mb-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{stepMessages[state.step]}</p>
                <p className="text-sm text-gray-400">{state.progress}% 완료</p>
              </div>
            </div>
            <Progress value={state.progress} className="h-1.5" />
          </div>
        )}

        {/* Error State */}
        {state.step === 'error' && (
          <div className="card-elevated p-6 mb-6 border-red-100 bg-red-50 animate-fade-in">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-red-600">{state.error}</p>
              <button onClick={resetState} className="btn-secondary text-sm">
                <RotateCcw className="w-4 h-4" />
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* Recording Section */}
        {(state.step === 'idle' || state.step === 'error') && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <h2 className="text-title text-gray-900">진료 대화 녹음</h2>
            </div>
            <AudioRecorder onAudioReady={processAudio} disabled={isProcessing} />

            {/* Demo Button */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400 mb-3">또는 샘플 데이터로 테스트</p>
              <button
                onClick={() => runSampleDemo()}
                className="btn-secondary text-sm"
              >
                🎯 샘플 데모 실행
              </button>
            </div>
          </div>
        )}

        {/* Results - Clinical Report */}
        {state.step === 'done' && state.clinicalData && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-title text-gray-900">AI 분석 결과</h2>
              </div>
              <button onClick={resetState} className="btn-secondary text-sm">
                <RotateCcw className="w-4 h-4" />
                새 녹음
              </button>
            </div>

            {/* Clinical Report Component */}
            <ClinicalReport
              data={{
                ...state.clinicalData,
                transcript: state.transcript,
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
