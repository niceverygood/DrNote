'use client'

import { useState } from 'react'
import {
  Clock,
  AlertTriangle,
  Stethoscope,
  Pill,
  Calendar,
  ChevronRight,
  Copy,
  Check,
  User,
  Activity,
  FileText
} from 'lucide-react'

export interface ClinicalData {
  // 기본 정보
  chiefComplaint: string
  duration: string
  onset: string

  // 증상
  symptoms: {
    text: string
    severity: 'mild' | 'moderate' | 'severe'
  }[]

  // 병력
  history: {
    type: 'trauma' | 'surgery' | 'disease' | 'medication'
    text: string
    date?: string
  }[]

  // 검사 소견
  findings: {
    name: string
    result: 'positive' | 'negative' | 'normal' | 'abnormal'
    value?: string
  }[]

  // 진단
  diagnosis: {
    primary: string
    differential?: string[]
  }

  // 치료 계획
  plan: {
    type: 'test' | 'medication' | 'procedure' | 'referral' | 'followup'
    text: string
    priority?: 'routine' | 'urgent' | 'stat'
  }[]

  // 키워드
  keywords: string[]

  // 원본 텍스트
  transcript: string
}

// 샘플 데이터 (실제로는 GPT에서 파싱)
const sampleData: ClinicalData = {
  chiefComplaint: 'Lt. knee pain',
  duration: '3주',
  onset: '외상 (축구 중 낙상)',

  symptoms: [
    { text: '무릎 통증', severity: 'moderate' },
    { text: '계단 보행 시 악화', severity: 'moderate' },
    { text: '간헐적 부종', severity: 'mild' },
  ],

  history: [
    { type: 'trauma', text: '축구 중 낙상', date: '3주 전' },
  ],

  findings: [
    { name: 'McMurray test', result: 'positive' },
    { name: 'Swelling', result: 'positive' },
    { name: 'ROM limitation', result: 'negative' },
    { name: 'Tenderness', result: 'positive', value: 'medial joint line' },
  ],

  diagnosis: {
    primary: 'Lt. knee medial meniscal tear',
    differential: ['ACL injury', 'Medial collateral ligament sprain'],
  },

  plan: [
    { type: 'test', text: 'MRI Lt. knee', priority: 'urgent' },
    { type: 'medication', text: 'NSAIDs (Celebrex 200mg bid)', priority: 'routine' },
    { type: 'procedure', text: 'Ice pack & compression', priority: 'routine' },
    { type: 'followup', text: 'F/U 2주 후 MRI 결과 확인', priority: 'routine' },
  ],

  keywords: ['Lt. knee', 'Meniscal tear', 'McMurray (+)', 'MRI', 'NSAIDs', 'Trauma'],

  transcript: '환자분 왼쪽 무릎이 3주 전부터 아프시다고 하셨죠. 축구하다가 넘어지셨고, 계단 오르내릴 때 특히 심하고 가끔 붓기도 한다고 하셨습니다. 검사해보니 맥머레이 테스트 양성이고 부종 있고 압통은 내측 관절선에서 느껴지네요. ROM은 괜찮습니다. 반월판 손상 의심되니까 MRI 찍어보시고 일단 소염제 처방해드릴게요.',
}

interface ClinicalReportProps {
  data?: ClinicalData
}

export function ClinicalReport({ data = sampleData }: ClinicalReportProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual')

  const handleCopy = () => {
    const text = generateCopyText(data)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-700 border-red-200'
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'mild': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'positive':
      case 'abnormal':
        return <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">+</span>
      case 'negative':
      case 'normal':
        return <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">−</span>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'stat':
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">STAT</span>
      case 'urgent':
        return <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded">URGENT</span>
      default:
        return null
    }
  }

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'test': return <Activity className="w-4 h-4" />
      case 'medication': return <Pill className="w-4 h-4" />
      case 'procedure': return <Stethoscope className="w-4 h-4" />
      case 'followup': return <Calendar className="w-4 h-4" />
      default: return <ChevronRight className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Clinical Summary</h2>
              <p className="text-slate-300 text-sm">AI-Generated Report • {new Date().toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      {/* Quick Summary Bar */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-700">C/C:</span>
            <span className="text-slate-900 font-semibold">{data.chiefComplaint}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{data.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-slate-600">{data.onset}</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 pt-4">
        <div className="inline-flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'visual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Visual Report
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'text'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Original Text
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="p-6 space-y-6">
          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Symptoms & History */}
            <div className="space-y-4">
              {/* Symptoms */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Symptoms
                </h3>
                <div className="space-y-2">
                  {data.symptoms.map((symptom, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium ${getSeverityColor(symptom.severity)}`}
                    >
                      {symptom.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              {data.history.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    History
                  </h3>
                  <div className="space-y-2">
                    {data.history.map((item, i) => (
                      <div key={i} className="text-sm text-amber-800">
                        <span className="font-medium">{item.text}</span>
                        {item.date && <span className="text-amber-600 ml-2">({item.date})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center Column - Physical Exam */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Physical Examination
              </h3>
              <div className="space-y-3">
                {data.findings.map((finding, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-slate-200">
                    <div>
                      <span className="font-medium text-slate-800">{finding.name}</span>
                      {finding.value && (
                        <span className="text-slate-500 text-sm ml-2">({finding.value})</span>
                      )}
                    </div>
                    {getResultIcon(finding.result)}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Diagnosis */}
            <div className="space-y-4">
              {/* Primary Diagnosis */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
                <h3 className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-2">
                  Assessment
                </h3>
                <p className="text-lg font-bold">{data.diagnosis.primary}</p>
              </div>

              {/* Differential */}
              {data.diagnosis.differential && data.diagnosis.differential.length > 0 && (
                <div className="bg-slate-100 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Differential Dx
                  </h3>
                  <ul className="space-y-1.5">
                    {data.diagnosis.differential.map((dx, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {dx}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Plan Section */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Plan
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.plan.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-teal-400">{getPlanIcon(item.type)}</span>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-white text-sm font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border border-teal-100"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Original Transcript
            </h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {data.transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function generateCopyText(data: ClinicalData): string {
  return `[Clinical Summary]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
C/C: ${data.chiefComplaint}
Duration: ${data.duration}
Onset: ${data.onset}

[Symptoms]
${data.symptoms.map(s => `• ${s.text} (${s.severity})`).join('\n')}

[P/E Findings]
${data.findings.map(f => `• ${f.name}: ${f.result}${f.value ? ` (${f.value})` : ''}`).join('\n')}

[Assessment]
${data.diagnosis.primary}
${data.diagnosis.differential ? `DDx: ${data.diagnosis.differential.join(', ')}` : ''}

[Plan]
${data.plan.map(p => `• ${p.text}${p.priority === 'urgent' ? ' [URGENT]' : ''}`).join('\n')}

[Keywords]
${data.keywords.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
}
