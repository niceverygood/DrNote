'use client'

import { useState, useCallback, useEffect } from 'react'
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  GraduationCap,
  Users,
  Scan,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ConsultationType, ChartStructured, CounselorSummary, AdditionalInfo } from '@/types/database'

type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'done' | 'error'

interface ChartData {
  chart: string
  chart_structured: ChartStructured
  note: string
  keywords: string[]
  consultation_type: ConsultationType
  counselor_summary: CounselorSummary
}

interface ChartRecord {
  id: string
  transcript: string
  chart: string
  chart_structured: ChartStructured | null
  note: string | null
  keywords: string[]
  consultation_type: ConsultationType
  counselor_summary: CounselorSummary | null
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

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ja', label: '日本語' },
]

interface TranslationData {
  translated_cc: string
  translated_pi: string
  translated_diagnosis: string
  translated_plan: string
  translated_note: string
}

interface PatientEducation {
  title: string
  description: string
  causes: string
  symptoms: string
  treatment: string
  precautions: string
  recovery: string
}

export default function DemoPage() {
  const [state, setState] = useState<ProcessingState>(initialState)
  const [records, setRecords] = useState<ChartRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [keywordSearch, setKeywordSearch] = useState('')
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [consultationType, setConsultationType] = useState<ConsultationType>('initial')

  // 추가 정보
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    pmh: '',
    surgical_history: '',
    medication: '',
    allergy: '',
  })
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false)

  // 번역
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [translation, setTranslation] = useState<TranslationData | null>(null)
  const [translating, setTranslating] = useState(false)

  // 환자 교육
  const [patientEducation, setPatientEducation] = useState<PatientEducation | null>(null)
  const [generatingEducation, setGeneratingEducation] = useState(false)

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
          chart_structured: chartData.chart_structured,
          note: chartData.note,
          keywords: chartData.keywords,
          consultation_type: chartData.consultation_type,
          counselor_summary: chartData.counselor_summary,
          additional_info: additionalInfo,
        }),
      })
      fetchRecords()
    } catch (error) {
      console.error('Save record error:', error)
    }
  }, [fetchRecords, additionalInfo])

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
        body: JSON.stringify({ transcript, consultation_type: consultationType }),
      })

      if (!summaryResponse.ok) {
        const error = await summaryResponse.json()
        throw new Error(error.error || '요약 실패')
      }

      const result = await summaryResponse.json()

      const chartData: ChartData = {
        chart: result.data.chart,
        chart_structured: result.data.chart_structured,
        note: result.data.note,
        keywords: result.data.keywords,
        consultation_type: result.data.consultation_type,
        counselor_summary: result.data.counselor_summary,
      }

      setState({
        step: 'done',
        progress: 100,
        transcript,
        chartData,
        error: '',
      })

      saveRecord(transcript, chartData)
      toast.success('차트 생성 완료!')
    } catch (error) {
      console.error('Processing error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [saveRecord, consultationType])

  const resetState = useCallback(() => {
    setState(initialState)
    setAdditionalInfo({ pmh: '', surgical_history: '', medication: '', allergy: '' })
    setShowAdditionalInfo(false)
    setTranslation(null)
    setSelectedLanguage(null)
    setPatientEducation(null)
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
        body: JSON.stringify({ transcript: sampleTranscript, consultation_type: consultationType }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '요약 실패')
      }

      const result = await response.json()

      const chartData: ChartData = {
        chart: result.data.chart,
        chart_structured: result.data.chart_structured,
        note: result.data.note,
        keywords: result.data.keywords,
        consultation_type: result.data.consultation_type,
        counselor_summary: result.data.counselor_summary,
      }

      setState({
        step: 'done',
        progress: 100,
        transcript: sampleTranscript,
        chartData,
        error: '',
      })

      saveRecord(sampleTranscript, chartData)
      toast.success('차트 생성 완료!')
    } catch (error) {
      console.error('Demo error:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setState((s) => ({ ...s, step: 'error', error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [saveRecord, consultationType])

  // 번역 요청
  const requestTranslation = useCallback(async (languageCode: string) => {
    if (!state.chartData?.chart_structured) return

    setTranslating(true)
    setSelectedLanguage(languageCode)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart: state.chartData.chart_structured,
          note: state.chartData.note,
          language: LANGUAGES.find(l => l.code === languageCode)?.label || 'English',
        }),
      })

      if (!response.ok) throw new Error('번역 실패')

      const result = await response.json()
      setTranslation(result.data)
      toast.success('번역 완료!')
    } catch {
      toast.error('번역에 실패했습니다')
      setSelectedLanguage(null)
    } finally {
      setTranslating(false)
    }
  }, [state.chartData])

  // 환자 교육 자료 생성
  const generatePatientEducation = useCallback(async () => {
    if (!state.chartData?.chart_structured?.diagnosis?.length) return

    setGeneratingEducation(true)

    try {
      const response = await fetch('/api/patient-education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnoses: state.chartData.chart_structured.diagnosis,
        }),
      })

      if (!response.ok) throw new Error('생성 실패')

      const result = await response.json()
      setPatientEducation(result.data)
      toast.success('환자 교육 자료 생성 완료!')
    } catch {
      toast.error('환자 교육 자료 생성에 실패했습니다')
    } finally {
      setGeneratingEducation(false)
    }
  }, [state.chartData])

  // 섹션 복사
  const copySection = (section: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
    toast.success('복사되었습니다')
  }

  // 전체 복사 (차트 + 추가정보 + 메모)
  const copyAll = () => {
    if (!state.chartData) return
    const cs = state.chartData.chart_structured

    let content = `[CC] ${cs.cc}\n[PI] ${cs.pi}\n`

    if (cs.diagnosis.length) {
      content += `\n[Diagnosis]\n${cs.diagnosis.join('\n')}\n`
    }
    if (cs.plan.length) {
      content += `\n[Plan]\n${cs.plan.map(p => `- ${p}`).join('\n')}\n`
    }
    if (state.chartData.note) {
      content += `\n[Note] ${state.chartData.note}\n`
    }

    // 추가 정보 포함
    const ai = additionalInfo
    if (ai.pmh || ai.surgical_history || ai.medication || ai.allergy) {
      content += '\n[Additional Info]\n'
      if (ai.pmh) content += `PMH: ${ai.pmh}\n`
      if (ai.surgical_history) content += `Surgical Hx: ${ai.surgical_history}\n`
      if (ai.medication) content += `Medication: ${ai.medication}\n`
      if (ai.allergy) content += `Allergy: ${ai.allergy}\n`
    }

    navigator.clipboard.writeText(content)
    toast.success('전체 복사되었습니다')
  }

  // 키워드 하이라이트
  const highlightKeywords = (text: string) => {
    if (!keywordSearch) return text

    const parts = text.split(new RegExp(`(${keywordSearch})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === keywordSearch.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : part
    )
  }

  const isProcessing = state.step !== 'idle' && state.step !== 'done' && state.step !== 'error'
  const cs = state.chartData?.chart_structured

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
            <Link href="/imaging" className="btn-ghost text-sm py-2 px-3">
              <Scan className="w-4 h-4" />
              영상분석
            </Link>
            <Link href="/counselor" className="btn-ghost text-sm py-2 px-3">
              <Users className="w-4 h-4" />
              상담사
            </Link>
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
            {/* 초진/재진 선택 */}
            <div className="mb-8 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">진료 유형:</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setConsultationType('initial')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    consultationType === 'initial'
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  초진 (Initial)
                </button>
                <button
                  onClick={() => setConsultationType('follow_up')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    consultationType === 'follow_up'
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  재진 (Follow-up)
                </button>
              </div>
            </div>

            <AudioRecorder onAudioReady={processAudio} disabled={isProcessing} />
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 mb-3">또는 샘플 데이터로 테스트</p>
              <button onClick={runSampleDemo} className="btn-secondary text-sm">
                샘플 데모 실행
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
        {state.step === 'done' && state.chartData && cs && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Voice Script */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900">Voice Script</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    state.chartData.consultation_type === 'follow_up'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    {state.chartData.consultation_type === 'follow_up' ? '재진' : '초진'}
                  </span>
                </div>
                <button onClick={resetState} className="btn-primary text-sm py-2 px-4">
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
                  {keywordSearch ? highlightKeywords(state.transcript) : state.transcript}
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
            <div className="space-y-4">
              {/* Main Chart */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-semibold text-gray-900">AI Chart</span>
                  </div>
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    전체 복사
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {/* CC */}
                  <ChartSection
                    title="Chief Complaint"
                    badge="CC"
                    badgeColor="bg-blue-100 text-blue-700"
                    content={cs.cc}
                    onCopy={() => copySection('cc', cs.cc)}
                    copied={copiedSection === 'cc'}
                  />

                  {/* PI */}
                  <ChartSection
                    title="Present Illness"
                    badge="PI"
                    badgeColor="bg-green-100 text-green-700"
                    content={cs.pi}
                    onCopy={() => copySection('pi', cs.pi)}
                    copied={copiedSection === 'pi'}
                    translation={translation?.translated_pi}
                  />

                  {/* Diagnosis */}
                  <ChartSection
                    title="Diagnosis"
                    badge="Dx"
                    badgeColor="bg-amber-100 text-amber-700"
                    content={cs.diagnosis.join('\n')}
                    onCopy={() => copySection('dx', cs.diagnosis.join('\n'))}
                    copied={copiedSection === 'dx'}
                    highlight
                    translation={translation?.translated_diagnosis}
                  >
                    {/* 환자 교육 버튼 */}
                    <button
                      onClick={generatePatientEducation}
                      disabled={generatingEducation}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      {generatingEducation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5" />
                      )}
                      환자 설명 생성
                    </button>
                  </ChartSection>

                  {/* Plan */}
                  <ChartSection
                    title="Plan"
                    badge="P"
                    badgeColor="bg-purple-100 text-purple-700"
                    content={cs.plan.map(p => `- ${p}`).join('\n')}
                    onCopy={() => copySection('plan', cs.plan.map(p => `- ${p}`).join('\n'))}
                    copied={copiedSection === 'plan'}
                    translation={translation?.translated_plan}
                  />

                  {/* Note */}
                  {state.chartData.note && (
                    <ChartSection
                      title="Note"
                      badge="N"
                      badgeColor="bg-gray-200 text-gray-600"
                      content={state.chartData.note}
                      onCopy={() => copySection('note', state.chartData?.note || '')}
                      copied={copiedSection === 'note'}
                    />
                  )}
                </div>

                {/* Translation Controls */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500">번역:</span>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => requestTranslation(lang.code)}
                        disabled={translating}
                        className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                          selectedLanguage === lang.code
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
                        } disabled:opacity-50`}
                      >
                        {lang.label}
                      </button>
                    ))}
                    {translating && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                  </div>
                </div>
              </div>

              {/* Additional Info - Collapsible */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">추가 정보 (PMH / 수술력 / 약물 / 알러지)</span>
                  {showAdditionalInfo ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showAdditionalInfo && (
                  <div className="px-5 pb-5 space-y-3">
                    <AdditionalField
                      label="Past Medical History (PMH)"
                      placeholder="고혈압, 당뇨 등 기저질환"
                      value={additionalInfo.pmh}
                      onChange={(v) => setAdditionalInfo(a => ({ ...a, pmh: v }))}
                    />
                    <AdditionalField
                      label="Surgical History (수술력)"
                      placeholder="이전 수술 이력"
                      value={additionalInfo.surgical_history}
                      onChange={(v) => setAdditionalInfo(a => ({ ...a, surgical_history: v }))}
                    />
                    <AdditionalField
                      label="Medication (현재 복용약)"
                      placeholder="현재 복용 중인 약물"
                      value={additionalInfo.medication}
                      onChange={(v) => setAdditionalInfo(a => ({ ...a, medication: v }))}
                    />
                    <AdditionalField
                      label="Allergy (알러지)"
                      placeholder="약물/음식 알러지"
                      value={additionalInfo.allergy}
                      onChange={(v) => setAdditionalInfo(a => ({ ...a, allergy: v }))}
                    />
                  </div>
                )}
              </div>

              {/* Patient Education */}
              {patientEducation && (
                <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-amber-50">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-900">환자 교육 자료</span>
                    </div>
                    <button
                      onClick={() => {
                        const edu = patientEducation
                        const text = `[${edu.title}]\n\n${edu.description}\n\n원인: ${edu.causes}\n증상: ${edu.symptoms}\n치료: ${edu.treatment}\n주의사항: ${edu.precautions}\n회복: ${edu.recovery}`
                        navigator.clipboard.writeText(text)
                        toast.success('환자 교육 자료 복사됨')
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 rounded transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      복사
                    </button>
                  </div>
                  <div className="p-5 space-y-3 text-sm text-gray-700">
                    <h4 className="font-bold text-gray-900">{patientEducation.title}</h4>
                    <p>{patientEducation.description}</p>
                    <div className="grid gap-2">
                      <EducationItem label="원인" content={patientEducation.causes} />
                      <EducationItem label="증상" content={patientEducation.symptoms} />
                      <EducationItem label="치료" content={patientEducation.treatment} />
                      <EducationItem label="주의사항" content={patientEducation.precautions} />
                      <EducationItem label="회복" content={patientEducation.recovery} />
                    </div>
                  </div>
                </div>
              )}
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
                          chart_structured: record.chart_structured || { cc: '', pi: '', diagnosis: [], plan: [] },
                          note: record.note || '',
                          keywords: record.keywords,
                          consultation_type: record.consultation_type || 'initial',
                          counselor_summary: record.counselor_summary || { explanation: '', treatment_reason: '', treatment_items: [] },
                        },
                        error: '',
                      })
                      setShowHistory(false)
                    }}
                    className="text-left p-3 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                        record.consultation_type === 'follow_up'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-teal-100 text-teal-600'
                      }`}>
                        {record.consultation_type === 'follow_up' ? '재진' : '초진'}
                      </span>
                    </div>
                    <p className="font-mono text-sm text-gray-800 truncate">
                      {record.chart_structured?.cc || record.chart.split('\n')[0]}
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

      {/* Bottom Recording Bar */}
      {state.step === 'done' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={resetState}
            className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-medium">새 녹음</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Chart Section Component
function ChartSection({
  title,
  badge,
  badgeColor,
  content,
  onCopy,
  copied,
  highlight,
  translation,
  children,
}: {
  title: string
  badge: string
  badgeColor: string
  content: string
  onCopy: () => void
  copied: boolean
  highlight?: boolean
  translation?: string
  children?: React.ReactNode
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeColor}`}>
            {badge}
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

      <div className={`p-3 rounded-lg ${highlight ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>

      {translation && (
        <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-500 font-medium mb-1">Translation</p>
          <p className="text-sm text-blue-800 whitespace-pre-wrap">{translation}</p>
        </div>
      )}

      {children}
    </div>
  )
}

// Additional Info Field
function AdditionalField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
      />
    </div>
  )
}

// Education Item
function EducationItem({ label, content }: { label: string; content: string }) {
  return (
    <div className="p-2.5 bg-amber-50 rounded-lg">
      <span className="text-xs font-semibold text-amber-700">{label}</span>
      <p className="text-sm text-gray-700 mt-0.5">{content}</p>
    </div>
  )
}
