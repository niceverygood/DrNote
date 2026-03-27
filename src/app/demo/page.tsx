'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { AudioRecorder } from '@/components/audio'
import { ChartResult } from '@/components/ChartResult'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, RotateCcw, Loader2, BookOpen, History, Clock } from 'lucide-react'
import { toast } from 'sonner'

type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'done' | 'error'

interface ChartData {
  chart: string
  note: string
  keywords: string[]
}

interface ChartRecord {
  id: string
  transcript: string
  chart: string
  note: string | null
  keywords: string[]
  created_at: string
}

interface ProcessingState {
  step: ProcessingStep
  progress: number
  transcript: string
  chartData: ChartData | null
  error: string
}

const initialState: ProcessingState = {
  step: 'idle',
  progress: 0,
  transcript: '',
  chartData: null,
  error: '',
}

const stepMessages: Record<ProcessingStep, string> = {
  idle: '',
  uploading: '오디오 업로드 중...',
  transcribing: 'Whisper AI가 음성을 분석하고 있습니다',
  summarizing: 'GPT-4o가 차트를 생성하고 있습니다',
  done: '분석 완료',
  error: '오류 발생',
}

export default function DemoPage() {
  const [state, setState] = useState<ProcessingState>(initialState)
  const [records, setRecords] = useState<ChartRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ChartRecord | null>(null)

  // 기록 불러오기
  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/records')
      const data = await response.json()
      if (data.records) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error('Fetch records error:', error)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // 기록 저장
  const saveRecord = useCallback(async (transcript: string, chartData: ChartData) => {
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          chart: chartData.chart,
          note: chartData.note,
          keywords: chartData.keywords,
        }),
      })
      fetchRecords()
    } catch (error) {
      console.error('Save record error:', error)
    }
  }, [fetchRecords])

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

      const result = await summaryResponse.json()

      setState({
        step: 'done',
        progress: 100,
        transcript,
        chartData: result.data,
        error: '',
      })

      // DB에 저장
      saveRecord(transcript, result.data)

      toast.success('차트 생성 완료!')
    } catch (error) {
      console.error('Processing error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [saveRecord])

  const resetState = useCallback(() => {
    setState(initialState)
    setSelectedRecord(null)
  }, [])

  // 샘플 데모 실행
  const runSampleDemo = useCallback(async () => {
    const sampleTranscript = `오른쪽 팔꿈치가 많이 아파요. 한 2주 됐어요.
테니스를 치다가 그런 것 같아요. 물건 들 때 특히 아프고요.
주사 맞으면 좋아질까요? 충격파 치료도 하고 싶어요.`

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
        chartData: result.data,
        error: '',
      })

      // DB에 저장
      saveRecord(sampleTranscript, result.data)

      toast.success('샘플 차트 생성 완료!')
    } catch (error) {
      console.error('Demo error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [saveRecord])

  // 기록 선택
  const selectRecord = (record: ChartRecord) => {
    setSelectedRecord(record)
    setState({
      step: 'done',
      progress: 100,
      transcript: record.transcript,
      chartData: {
        chart: record.chart,
        note: record.note || '',
        keywords: record.keywords,
      },
      error: '',
    })
    setShowHistory(false)
  }

  const isProcessing = state.step !== 'idle' && state.step !== 'done' && state.step !== 'error'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-base font-semibold text-gray-900">Dr.Note</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`btn-ghost text-sm py-2 px-3 ${showHistory ? 'bg-gray-100' : ''}`}
            >
              <History className="w-4 h-4" />
              기록 ({records.length})
            </button>
            <Link href="/dictionary" className="btn-ghost text-sm py-2 px-3">
              <BookOpen className="w-4 h-4" />
              사전
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* History Panel */}
        {showHistory && (
          <div className="card-elevated p-4 mb-6 animate-fade-in">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              최근 기록
            </h3>
            {records.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">기록이 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {records.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => selectRecord(record)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRecord?.id === record.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-gray-800 truncate">
                          {record.chart.split('\\n')[0]}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{formatDate(record.created_at)}</span>
                        </div>
                      </div>
                      {record.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {record.keywords.slice(0, 2).map((kw, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
                onClick={runSampleDemo}
                className="btn-secondary text-sm"
              >
                🎯 샘플 데모 실행
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {state.step === 'done' && state.chartData && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-title text-gray-900">생성된 차트</h2>
              </div>
              <button onClick={resetState} className="btn-secondary text-sm">
                <RotateCcw className="w-4 h-4" />
                새 녹음
              </button>
            </div>

            {/* Chart Result */}
            <ChartResult
              data={state.chartData}
              transcript={state.transcript}
            />
          </div>
        )}
      </main>
    </div>
  )
}
