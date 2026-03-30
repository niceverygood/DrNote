'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AudioRecorder } from '@/components/audio'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  RotateCcw,
  Loader2,
  BookOpen,
  History,
  Copy,
  Check,
  Mic,
  FileText,
  Search,
  Clock,
  RefreshCw
} from 'lucide-react'
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

interface SectionMemo {
  subjective: string
  objective: string
  diagnosis: string
  plan: string
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
  const [keywordSearch, setKeywordSearch] = useState('')
  const [memos, setMemos] = useState<SectionMemo>({
    subjective: '',
    objective: '',
    diagnosis: '',
    plan: '',
  })
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

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
    setMemos({ subjective: '', objective: '', diagnosis: '', plan: '' })
  }, [])

  // 샘플 데모 실행
  const runSampleDemo = useCallback(async () => {
    const sampleTranscript = `이거 봐줄까요.
그렇구나
네 일단 뻣을 때는 저것다.
있어 원래 팔꿈치는 엑셀에서 보이는 건 없고 목 같은 경우는 이제 보면 원래 사람 목은 이렇게 곡 시장형으로 생긴 게 정상인데 보시다시피 좀 일자로 확 펴져 있죠 우리 흔히 말하는 일자목으로 된 거고 저거는 이제 뒤에 있는 근육은 약해지고 앞에 있는 근육은 짧고 타이트해지면서 점점 점 이렇게 앞으니는 거예요.
여기서 이제 더 관리가 안 되면 우리가 흔히 말하는 역자자원거북목으로 이렇게 게 되기 때문에 더 진행되지 않게 관리를 좀 잘 하셔야 됩니다.
지금부터는 저렇게 일자로 된 로 판이 꺾이면은 시점일 때보다 일점이 되면 아래쪽에 있는 디스크가 하중을 더 많이 받아서 애네가 좀 빨리 상해요.
기본적으로 그래서 디스크가 상하면서 생기는 이제 통증들이 목통 이제 목이나 어깨 당 갈리듯이 오는 가려든지 어깨 축지나 대오오 내려오거나 뒷골 당기거나 머리 아프고 는 주위도 아프고 이런 통증이 오기도 하는데 더 진행된다 이제 팔로 내려가는 신경을 이제 자극하면서 지금처럼 팔저림이라든지 이 이런 증상 생길 수가 있어요.
근데 이제 그런 원인이 되는 구조물들은 사실 엑셀에서 보이는 구조물들이 대부분은 아니기 때문에 이것만 보고 확실히 알 수는 없지만 지금은 가능성이 두 곳 다 있기는 하다.
근데 저는 항상 돌아갈을 때 이제 비행기 타고 그렇게 자세를 뺐을 때 이쪽에서 눌리고 있을 확률이 조금 더 높을 것 같기는 한데 이쪽으로 관련된 치료를 했는데도 불구하고 좀 남아 있다고 한다면은 그거는 이제 목에서도 걸쳐 있다는 얘기이기 때문에 이쪽에 치료를 같이 병행하시는 게 좋아요.
주사 치료는 보통 한 일주일 간격으로 한두 번 정도 안에 끝나는 경우가 많고 충격파는 보통 주 2회에 올 때 한 2~3주 사이 정도 안 나아진 경우가 많기 때문에 그렇게 진행을 해보고 나아지는 정도를 봐서 나중에 추가로 목적으로 주사치를 한 번 더 하든지 이렇게 진행 해보시면 될 것 같습니다.
지금 밖에서 안내해드릴게요 잠시만 얘기해 주시면 안내 도와드릴게요`

    setState({ ...initialState, step: 'summarizing', progress: 50, transcript: sampleTranscript })

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

      saveRecord(sampleTranscript, result.data)
      toast.success('차트 생성 완료!')
    } catch (error) {
      console.error('Demo error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [saveRecord])

  // 섹션 복사
  const copySection = (section: string, content: string) => {
    const memo = memos[section as keyof SectionMemo]
    const fullContent = memo ? `${content}\n\n[메모] ${memo}` : content
    navigator.clipboard.writeText(fullContent)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
    toast.success('복사되었습니다')
  }

  // 전체 복사 (원문 요약 + 차트 + 메모)
  const copyAll = () => {
    if (!state.chartData) return
    // 원문은 100자 이내로 요약
    const shortTranscript = state.transcript.length > 100
      ? state.transcript.slice(0, 100) + '...'
      : state.transcript
    const content = `[원문]\n${shortTranscript}\n\n[차트]\n${state.chartData.chart}${state.chartData.note ? `\n\n[메모]\n${state.chartData.note}` : ''}`
    navigator.clipboard.writeText(content)
    toast.success('전체 복사되었습니다')
  }

  // 키워드 하이라이트
  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords.length || !keywordSearch) return text

    const searchLower = keywordSearch.toLowerCase()
    const parts = text.split(new RegExp(`(${keywordSearch})`, 'gi'))

    return parts.map((part, i) =>
      part.toLowerCase() === searchLower ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : part
    )
  }

  // 차트 파싱
  const parseChart = (chart: string) => {
    const lines = chart.split('\\n').join('\n').split('\n')
    let subjective = ''
    let objective = ''
    let diagnosis = ''
    let plan = ''

    let currentSection = 'subjective'

    lines.forEach(line => {
      if (line.startsWith('r/o') || line.startsWith('R/O')) {
        diagnosis += line + '\n'
        currentSection = 'diagnosis'
      } else if (line.startsWith('P>') || line.startsWith('P >')) {
        currentSection = 'plan'
        plan += line + '\n'
      } else if (line.startsWith('- ')) {
        if (currentSection === 'plan') {
          plan += line + '\n'
        }
      } else if (line.trim()) {
        if (currentSection === 'subjective' && !diagnosis && !plan) {
          subjective += line + '\n'
        }
      }
    })

    return {
      subjective: subjective.trim() || lines[0] || '',
      objective: objective.trim(),
      diagnosis: diagnosis.trim(),
      plan: plan.trim(),
    }
  }

  const isProcessing = state.step !== 'idle' && state.step !== 'done' && state.step !== 'error'
  const parsedChart = state.chartData ? parseChart(state.chartData.chart) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Dr.Note</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`btn-ghost text-sm py-2 px-3 ${showHistory ? 'bg-gray-100' : ''}`}
            >
              <History className="w-4 h-4" />
              기록
            </button>
            <Link href="/dictionary" className="btn-ghost text-sm py-2 px-3">
              <BookOpen className="w-4 h-4" />
              사전
            </Link>
          </div>
        </div>
      </header>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              <span className="font-medium text-gray-900">{stepMessages[state.step]}</span>
              <span className="text-sm text-gray-400">{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="h-1" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Initial State - Recording */}
        {state.step === 'idle' && (
          <div className="flex flex-col items-center justify-center py-20">
            <AudioRecorder onAudioReady={processAudio} disabled={isProcessing} />
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 mb-3">또는 샘플 데이터로 테스트</p>
              <button onClick={runSampleDemo} className="btn-secondary text-sm">
                🎯 샘플 데모 실행
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.step === 'error' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="card-elevated p-8 text-center max-w-md">
              <p className="text-red-600 mb-4">{state.error}</p>
              <button onClick={resetState} className="btn-primary">
                <RotateCcw className="w-4 h-4" />
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* Results - Two Column Layout */}
        {state.step === 'done' && state.chartData && parsedChart && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Voice Script */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Voice Script</span>
                </div>
                <button
                  onClick={resetState}
                  className="btn-primary text-sm py-2 px-4"
                >
                  <RefreshCw className="w-4 h-4" />
                  새 진료 시작
                </button>
              </div>

              {/* Search */}
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="키워드를 검색하세요"
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Transcript */}
              <div className="p-5 max-h-[600px] overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {keywordSearch
                    ? highlightKeywords(state.transcript, state.chartData.keywords)
                    : state.transcript
                  }
                </p>
              </div>

              {/* Keywords */}
              {state.chartData.keywords.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-2">추출된 키워드</p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.chartData.keywords.map((kw, i) => (
                      <button
                        key={i}
                        onClick={() => setKeywordSearch(kw)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          keywordSearch === kw
                            ? 'bg-teal-500 text-white'
                            : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - AI Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-semibold text-gray-900">AI Summary</span>
                </div>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  전체 복사
                </button>
              </div>

              {/* Sections */}
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {/* 주관적 소견 */}
                <SummarySection
                  title="주관적 소견"
                  icon="S"
                  content={parsedChart.subjective}
                  memo={memos.subjective}
                  onMemoChange={(v) => setMemos(m => ({ ...m, subjective: v }))}
                  onCopy={() => copySection('subjective', parsedChart.subjective)}
                  copied={copiedSection === 'subjective'}
                />

                {/* 객관적 소견 */}
                <SummarySection
                  title="객관적 소견"
                  icon="O"
                  content={state.chartData.note || '특이 소견 없음'}
                  memo={memos.objective}
                  onMemoChange={(v) => setMemos(m => ({ ...m, objective: v }))}
                  onCopy={() => copySection('objective', state.chartData?.note || '')}
                  copied={copiedSection === 'objective'}
                />

                {/* 진단명 */}
                <SummarySection
                  title="진단명"
                  icon="A"
                  content={parsedChart.diagnosis || 'r/o 진단 대기'}
                  memo={memos.diagnosis}
                  onMemoChange={(v) => setMemos(m => ({ ...m, diagnosis: v }))}
                  onCopy={() => copySection('diagnosis', parsedChart.diagnosis)}
                  copied={copiedSection === 'diagnosis'}
                  highlight
                />

                {/* 진료 계획 */}
                <SummarySection
                  title="진료 계획"
                  icon="P"
                  content={parsedChart.plan || 'P> 계획 없음'}
                  memo={memos.plan}
                  onMemoChange={(v) => setMemos(m => ({ ...m, plan: v }))}
                  onCopy={() => copySection('plan', parsedChart.plan)}
                  copied={copiedSection === 'plan'}
                />
              </div>
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && records.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-4 h-4" />
                최근 기록
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {records.slice(0, 9).map((record) => (
                  <button
                    key={record.id}
                    onClick={() => {
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
                    }}
                    className="text-left p-3 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-colors"
                  >
                    <p className="font-mono text-sm text-gray-800 truncate">
                      {record.chart.split('\\n')[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(record.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Recording Bar (when viewing results) */}
      {state.step === 'done' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={resetState}
            className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-medium">녹음 전</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono">00:00</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Summary Section Component
function SummarySection({
  title,
  icon,
  content,
  memo,
  onMemoChange,
  onCopy,
  copied,
  highlight,
}: {
  title: string
  icon: string
  content: string
  memo: string
  onMemoChange: (value: string) => void
  onCopy: () => void
  copied: boolean
  highlight?: boolean
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
            highlight ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {icon}
          </span>
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
          복사
        </button>
      </div>

      <div className={`p-3 rounded-lg mb-3 ${highlight ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>

      <input
        type="text"
        placeholder="메모 입력"
        value={memo}
        onChange={(e) => onMemoChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
    </div>
  )
}
