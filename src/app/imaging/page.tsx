'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Upload,
  Loader2,
  Copy,
  Check,
  Bone,
  Activity,
  CircleDot,
  Scan,
  FileText,
  Ruler,
  MessageSquare,
  ClipboardList,
  ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

type AnalysisType = 'bone_age' | 'spine_alignment' | 'knee_alignment' | 'general'

interface AnalysisOption {
  type: AnalysisType
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    type: 'bone_age',
    label: '골연령 검사',
    description: '손/손목 X-ray로 성장판 나이 평가',
    icon: <Bone className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    type: 'spine_alignment',
    label: '척추 정렬 분석',
    description: 'Cobb angle, 전만/후만각 측정',
    icon: <Activity className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    type: 'knee_alignment',
    label: '무릎 정렬 분석',
    description: '내반/외반, 기계적 축 측정',
    icon: <CircleDot className="w-5 h-5" />,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    type: 'general',
    label: '일반 정형외과 판독',
    description: '모든 부위 X-ray 종합 분석',
    icon: <Scan className="w-5 h-5" />,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalysisResult = Record<string, any>

export default function ImagingPage() {
  const [selectedType, setSelectedType] = useState<AnalysisType>('general')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [patientAge, setPatientAge] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [showMeasurements, setShowMeasurements] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // PACS에서 캡처된 이미지 수신
  useEffect(() => {
    const pacsCapture = sessionStorage.getItem('pacs_capture')
    if (pacsCapture) {
      setImagePreview(pacsCapture)
      // base64를 File로 변환
      fetch(pacsCapture)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'pacs_capture.png', { type: 'image/png' })
          setImageFile(file)
        })
      sessionStorage.removeItem('pacs_capture')
      sessionStorage.removeItem('pacs_metadata')
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setImageFile(file)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const analyzeImage = useCallback(async () => {
    if (!imageFile) return

    setAnalyzing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('analysis_type', selectedType)
      if (patientAge) formData.append('patient_age', patientAge)

      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '분석 실패')
      }

      const data = await response.json()
      setResult(data.data)
      toast.success('영상 분석 완료!')
    } catch (error) {
      const msg = error instanceof Error ? error.message : '알 수 없는 오류'
      toast.error(msg)
    } finally {
      setAnalyzing(false)
    }
  }, [imageFile, selectedType, patientAge])

  const copyText = (section: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
    toast.success('복사됨')
  }

  const resetAll = () => {
    setImageFile(null)
    setImagePreview(null)
    setResult(null)
    setPatientAge('')
  }

  const currentOption = ANALYSIS_OPTIONS.find(o => o.type === selectedType)!

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/demo" className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-teal-600" />
              <h1 className="text-lg font-semibold text-gray-900">AI 영상 분석</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pacs" className="btn-ghost text-sm py-2 px-3 flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              PACS 뷰어
            </Link>
            {result && (
              <button onClick={resetAll} className="btn-ghost text-sm py-2 px-3">
                새 영상 분석
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Analysis Type Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {ANALYSIS_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => { setSelectedType(option.type); setResult(null) }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === option.type
                  ? `${option.color} shadow-sm`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {option.icon}
                <span className="font-semibold text-sm">{option.label}</span>
              </div>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left - Image Upload & Preview */}
          <div className="space-y-4">
            {/* Upload Area */}
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-teal-400 transition-colors cursor-pointer p-12 text-center"
              >
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="font-medium text-gray-700 mb-1">X-ray 영상을 업로드하세요</p>
                <p className="text-sm text-gray-400">클릭하거나 드래그 앤 드롭</p>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, DICOM 지원 (최대 20MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{imageFile?.name}</span>
                  </div>
                  <button
                    onClick={() => { setImagePreview(null); setImageFile(null); setResult(null) }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="p-4 bg-black flex items-center justify-center min-h-[400px]">
                  <Image
                    src={imagePreview}
                    alt="X-ray"
                    width={600}
                    height={600}
                    className="max-w-full max-h-[500px] object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Patient Info & Analyze Button */}
            {imagePreview && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-end gap-4">
                  {selectedType === 'bone_age' && (
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        환자 나이 (선택)
                      </label>
                      <input
                        type="number"
                        placeholder="만 나이"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        GPT-4o Vision 분석 중...
                      </>
                    ) : (
                      <>
                        <Scan className="w-5 h-5" />
                        {currentOption.label} 시작
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right - Analysis Result */}
          <div className="space-y-4">
            {!result && !analyzing && (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Scan className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">영상을 업로드하고 분석을 시작하세요</p>
                <p className="text-sm text-gray-400 mt-1">GPT-4o Vision이 정형외과 영상을 분석합니다</p>
              </div>
            )}

            {analyzing && (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                <p className="font-medium text-gray-700">AI가 영상을 분석하고 있습니다</p>
                <p className="text-sm text-gray-400 mt-1">약 10~20초 소요됩니다</p>
              </div>
            )}

            {result && (
              <>
                {/* Findings */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-teal-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <h2 className="font-semibold text-teal-900">분석 결과</h2>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${currentOption.color}`}>
                        {currentOption.label}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {result.findings && Object.entries(result.findings).map(([key, value]) => {
                      if (key === 'key_observations') return null
                      const label = FINDING_LABELS[key] || key
                      const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
                      return (
                        <div key={key} className="px-5 py-3 flex items-start gap-3">
                          <span className="text-xs font-medium text-gray-500 min-w-[120px] pt-0.5">{label}</span>
                          <span className="text-sm text-gray-800">{displayValue}</span>
                        </div>
                      )
                    })}

                    {/* Key Observations */}
                    {result.findings?.key_observations?.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">주요 소견</p>
                        <ul className="space-y-1.5">
                          {result.findings.key_observations.map((obs: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Measurements */}
                {result.measurements && Object.keys(result.measurements).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setShowMeasurements(!showMeasurements)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold text-gray-900">측정값</h2>
                      </div>
                      {showMeasurements ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {showMeasurements && (
                      <div className="px-5 pb-5">
                        <div className="grid gap-3">
                          {Object.entries(result.measurements).map(([key, value]) => {
                            const label = MEASUREMENT_LABELS[key] || key
                            if (typeof value === 'object' && value !== null) {
                              const obj = value as Record<string, string>
                              return (
                                <div key={key} className="p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs font-semibold text-purple-700 mb-1">{label}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(obj).map(([k, v]) => (
                                      <div key={k}>
                                        <span className="text-[10px] text-gray-500">{MEASUREMENT_LABELS[k] || k}</span>
                                        <p className="text-sm font-mono font-bold text-gray-800">{String(v)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return (
                              <div key={key} className="p-3 bg-purple-50 rounded-lg flex items-center justify-between">
                                <span className="text-xs font-semibold text-purple-700">{label}</span>
                                <span className="text-sm font-mono font-bold text-gray-800">{String(value)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Patient Explanation */}
                {result.patient_explanation && (
                  <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-amber-600" />
                        <h2 className="font-semibold text-amber-900">환자 설명용</h2>
                      </div>
                      <button
                        onClick={() => copyText('patient', result.patient_explanation)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 rounded transition-colors"
                      >
                        {copiedSection === 'patient' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        복사
                      </button>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-gray-700 leading-relaxed">{result.patient_explanation}</p>
                    </div>
                  </div>
                )}

                {/* Clinical Note */}
                {result.clinical_note && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-gray-600" />
                        <h2 className="font-semibold text-gray-900">차트 기재용</h2>
                      </div>
                      <button
                        onClick={() => copyText('clinical', result.clinical_note)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        {copiedSection === 'clinical' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                        EMR 복사
                      </button>
                    </div>
                    <div className="p-5 bg-gray-50">
                      <p className="text-sm font-mono text-gray-800 whitespace-pre-wrap">{result.clinical_note}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

const FINDING_LABELS: Record<string, string> = {
  overall_alignment: '전체 정렬',
  overall_impression: '종합 소견',
  estimated_bone_age: '추정 골연령',
  chronological_age_comparison: '실제 나이 대비',
  skeletal_maturity: '골성숙도',
  greulich_pyle_assessment: 'Greulich-Pyle 평가',
  scoliosis: '측만증',
  kyphosis: '후만증',
  lordosis: '전만 상태',
  disc_space: '디스크 간격',
  valgus_varus: '외반/내반',
  joint_space: '관절 간격',
  osteophytes: '골극',
  kl_grade: 'K-L 등급',
  body_part: '촬영 부위',
  abnormalities: '이상 소견',
  normal_findings: '정상 소견',
}

const MEASUREMENT_LABELS: Record<string, string> = {
  bone_age_years: '골연령 (년)',
  confidence: '신뢰도',
  cobb_angle: 'Cobb Angle',
  lumbar_lordosis: '요추 전만각',
  thoracic_kyphosis: '흉추 후만각',
  sva: 'SVA',
  mechanical_axis: '기계적 축',
  anatomical_tfa: 'TF Angle',
  joint_line_angle: '관절선 각도',
  value: '측정값',
  location: '위치',
  severity: '중증도',
  normal_range: '정상 범위',
  deviation: '편위',
}
