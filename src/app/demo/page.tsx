'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AudioRecorder } from '@/components/audio'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'done' | 'error'

interface SoapNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface ProcessingState {
  step: ProcessingStep
  progress: number
  transcript: string
  soap: SoapNote | null
  keywords: string[]
  rawResponse: string
  error: string
}

const initialState: ProcessingState = {
  step: 'idle',
  progress: 0,
  transcript: '',
  soap: null,
  keywords: [],
  rawResponse: '',
  error: '',
}

const stepMessages: Record<ProcessingStep, string> = {
  idle: '',
  uploading: '오디오 업로드 중...',
  transcribing: 'Whisper AI가 음성을 분석하고 있습니다',
  summarizing: 'GPT-4o가 SOAP 차트를 생성하고 있습니다',
  done: '분석 완료',
  error: '오류 발생',
}

export default function DemoPage() {
  const [state, setState] = useState<ProcessingState>(initialState)
  const [activeTab, setActiveTab] = useState<'soap' | 'raw' | 'transcript'>('soap')

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
        soap: summaryResult.soap,
        keywords: summaryResult.keywords,
        rawResponse: summaryResult.rawResponse,
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
    setActiveTab('soap')
  }, [])

  const isProcessing = state.step !== 'idle' && state.step !== 'done' && state.step !== 'error'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
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
              <p className="text-xs text-gray-400">정형외과 AI 차트 요약</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
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
          </div>
        )}

        {/* Results */}
        {state.step === 'done' && state.soap && (
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

            {/* Keywords */}
            {state.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.keywords.map((keyword, index) => (
                  <span key={index} className="badge-primary">{keyword}</span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-gray-100 rounded-xl p-1 inline-flex gap-1">
              {[
                { id: 'soap', label: 'SOAP 차트' },
                { id: 'raw', label: '전체 요약' },
                { id: 'transcript', label: 'STT 원문' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="card-elevated p-8">
              {activeTab === 'soap' && (
                <div className="space-y-6">
                  <SoapSection label="S" title="Subjective" content={state.soap.subjective} variant="s" />
                  <hr className="border-gray-100" />
                  <SoapSection label="O" title="Objective" content={state.soap.objective} variant="o" />
                  <hr className="border-gray-100" />
                  <SoapSection label="A" title="Assessment" content={state.soap.assessment} variant="a" />
                  <hr className="border-gray-100" />
                  <SoapSection label="P" title="Plan" content={state.soap.plan} variant="p" />
                </div>
              )}

              {activeTab === 'raw' && (
                <pre className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed font-sans">
                  {state.rawResponse || '요약 내용이 없습니다.'}
                </pre>
              )}

              {activeTab === 'transcript' && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                    Whisper STT 변환 결과
                  </p>
                  <p className="text-gray-700 leading-relaxed">{state.transcript}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SoapSection({
  label,
  title,
  content,
  variant,
}: {
  label: string
  title: string
  content: string
  variant: 's' | 'o' | 'a' | 'p'
}) {
  const colors = {
    s: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    o: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    a: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    p: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  }
  const c = colors[variant]

  return (
    <div className="flex gap-5">
      <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
        <span className={`text-base font-bold ${c.text}`}>{label}</span>
      </div>
      <div className="flex-1 pt-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">{title}</p>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {content || '내용 없음'}
        </div>
      </div>
    </div>
  )
}
