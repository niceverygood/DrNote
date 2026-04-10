'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Calendar, BookOpen, ClipboardList, Phone,
  ChevronRight, Clock, ArrowLeft, Send, Loader2,
  Heart, Stethoscope, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { BrandIcon } from '@/components/BrandIcon'

interface PatientRecord {
  id: string
  hospital_name: string | null
  doctor_name: string | null
  visit_date: string
  diagnosis_simple: string | null
  patient_summary: string | null
  plan_simple: string | null
  education: Record<string, string>
}

interface Questionnaire {
  id: string
  visit_date: string
  status: string
  content: Record<string, string>
  created_at: string
}

type Tab = 'home' | 'records' | 'appointment' | 'questionnaire' | 'education'

// 문진 항목
const QUESTIONNAIRE_FIELDS = [
  { key: 'chief_complaint', label: '어디가 아프신가요?', placeholder: '예: 오른쪽 어깨가 아파요' },
  { key: 'onset', label: '언제부터 아프셨나요?', placeholder: '예: 2주 전부터' },
  { key: 'cause', label: '아프게 된 계기가 있나요?', placeholder: '예: 운동 후, 넘어져서, 자연적으로' },
  { key: 'severity', label: '통증 정도 (0~10)', placeholder: '0=없음, 10=최악' },
  { key: 'aggravating', label: '어떨 때 더 아파지나요?', placeholder: '예: 팔 올릴 때, 앉아있을 때' },
  { key: 'medications', label: '현재 드시는 약이 있나요?', placeholder: '예: 혈압약, 당뇨약' },
  { key: 'allergy', label: '알러지가 있나요?', placeholder: '예: 없음, 페니실린' },
  { key: 'surgery_history', label: '이전 수술 이력', placeholder: '예: 없음, 2020년 무릎 수술' },
  { key: 'other', label: '의사에게 전하고 싶은 말', placeholder: '자유롭게 작성해주세요' },
]

export default function PatientPage() {
  const [tab, setTab] = useState<Tab>('home')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null)

  // 문진표
  const [questionnaireForm, setQuestionnaireForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // 간편 인증 (개발 모드: 전화번호 입력만)
  const handleVerify = () => {
    if (phone.length < 4) { toast.error('전화번호를 입력해주세요'); return }
    setIsVerified(true)
    toast.success('확인되었습니다')
    fetchRecords()
    fetchQuestionnaires()
  }

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/patient?phone=${phone}&type=records`)
      const data = await res.json()
      if (data.records) setRecords(data.records)
    } catch (error) { console.error('Fetch error:', error) }
  }, [phone])

  const fetchQuestionnaires = useCallback(async () => {
    try {
      const res = await fetch(`/api/patient?phone=${phone}&type=questionnaires`)
      const data = await res.json()
      if (data.questionnaires) setQuestionnaires(data.questionnaires)
    } catch (error) { console.error('Fetch error:', error) }
  }, [phone])

  // 문진표 제출
  const submitQuestionnaire = async () => {
    const filled = Object.values(questionnaireForm).filter(v => v.trim()).length
    if (filled < 3) { toast.error('최소 3개 항목을 작성해주세요'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_questionnaire',
          patient_phone: phone,
          patient_name: name,
          content: questionnaireForm,
        }),
      })
      if (res.ok) {
        toast.success('문진표가 제출되었습니다')
        setQuestionnaireForm({})
        setTab('home')
        fetchQuestionnaires()
      }
    } catch { toast.error('제출에 실패했습니다') }
    finally { setSubmitting(false) }
  }

  // 미인증 상태: 전화번호 입력
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-fit"><BrandIcon size={64} /></div>
            <h1 className="text-xl font-bold" style={{ color: '#0F1C3A' }}>Dr.Note 환자용</h1>
            <p className="text-sm text-gray-500 mt-1">내 진료 기록을 확인하세요</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">이름</label>
                <input type="text" placeholder="홍길동" value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">전화번호</label>
                <input type="tel" placeholder="010-0000-0000" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button onClick={handleVerify}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandIcon size={28} />
            <span className="font-semibold" style={{ color: '#0F1C3A' }}>Dr.Note</span>
          </div>
          <span className="text-sm text-gray-500">{name || phone}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Home */}
        {tab === 'home' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {name ? `${name}님, 안녕하세요` : '안녕하세요'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <MenuCard icon={FileText} label="내 진료 기록" desc={`${records.length}건`}
                color="bg-blue-50 text-blue-600" onClick={() => setTab('records')} />
              <MenuCard icon={Calendar} label="예약 확인" desc="예약 관리"
                color="bg-amber-50 text-amber-600" onClick={() => { window.location.href = '/calendar' }} />
              <MenuCard icon={ClipboardList} label="사전 문진" desc="방문 전 작성"
                color="bg-green-50 text-green-600" onClick={() => setTab('questionnaire')} />
              <MenuCard icon={BookOpen} label="건강 교육" desc="내 질환 안내"
                color="bg-purple-50 text-purple-600" onClick={() => setTab('education')} />
            </div>

            {/* 최근 기록 */}
            {records.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">최근 진료</h3>
                </div>
                {records.slice(0, 3).map(r => (
                  <button key={r.id} onClick={() => { setSelectedRecord(r); setTab('records') }}
                    className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.diagnosis_simple || '진료 기록'}</p>
                        <p className="text-xs text-gray-500">{r.hospital_name} · {r.visit_date}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 문진표 이력 */}
            {questionnaires.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">제출한 문진표</h3>
                {questionnaires.slice(0, 3).map(q => (
                  <div key={q.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-700">{q.visit_date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      q.status === 'reviewed' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                    }`}>{q.status === 'reviewed' ? '확인됨' : '대기 중'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Records */}
        {tab === 'records' && !selectedRecord && (
          <div>
            <button onClick={() => setTab('home')} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">내 진료 기록</h2>
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>아직 진료 기록이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map(r => (
                  <button key={r.id} onClick={() => setSelectedRecord(r)}
                    className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{r.diagnosis_simple || '진료'}</span>
                      <span className="text-xs text-gray-400">{r.visit_date}</span>
                    </div>
                    <p className="text-sm text-gray-500">{r.hospital_name} · {r.doctor_name || ''}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Record Detail */}
        {tab === 'records' && selectedRecord && (
          <div>
            <button onClick={() => setSelectedRecord(null)} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <ArrowLeft className="w-4 h-4" /> 목록으로
            </button>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: '#0F1C3A' }}>
                <h3 className="font-bold text-white">{selectedRecord.diagnosis_simple || '진료 기록'}</h3>
                <p className="text-sm text-gray-300 mt-0.5">
                  {selectedRecord.hospital_name} · {selectedRecord.visit_date}
                </p>
              </div>
              <div className="p-5 space-y-4">
                {selectedRecord.patient_summary && (
                  <Section icon={Heart} title="진료 요약" color="text-pink-600">
                    <p className="text-sm text-gray-700">{selectedRecord.patient_summary}</p>
                  </Section>
                )}
                {selectedRecord.plan_simple && (
                  <Section icon={Stethoscope} title="치료 계획" color="text-teal-600">
                    <p className="text-sm text-gray-700">{selectedRecord.plan_simple}</p>
                  </Section>
                )}
                {selectedRecord.education && Object.keys(selectedRecord.education).length > 0 && (
                  <Section icon={BookOpen} title="알아두세요" color="text-purple-600">
                    {Object.entries(selectedRecord.education).map(([k, v]) => (
                      <div key={k} className="mb-2">
                        <p className="text-xs font-semibold text-gray-500">{k}</p>
                        <p className="text-sm text-gray-700">{v}</p>
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire */}
        {tab === 'questionnaire' && (
          <div>
            <button onClick={() => setTab('home')} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-1">사전 문진표</h2>
            <p className="text-sm text-gray-500 mb-4">방문 전 미리 작성하면 진료가 빨라집니다</p>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              {QUESTIONNAIRE_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{field.label}</label>
                  <input type="text" placeholder={field.placeholder}
                    value={questionnaireForm[field.key] || ''}
                    onChange={e => setQuestionnaireForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              ))}

              <button onClick={submitQuestionnaire} disabled={submitting}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                문진표 제출
              </button>
            </div>
          </div>
        )}

        {/* Education */}
        {tab === 'education' && (
          <div>
            <button onClick={() => setTab('home')} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">건강 교육 자료</h2>
            {records.filter(r => r.education && Object.keys(r.education).length > 0).length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>진료 기록에서 교육 자료가 생성됩니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.filter(r => r.education && Object.keys(r.education).length > 0).map(r => (
                  <div key={r.id} className="bg-white rounded-xl border p-4">
                    <p className="font-medium text-gray-900 mb-2">{r.diagnosis_simple}</p>
                    {Object.entries(r.education).map(([k, v]) => (
                      <p key={k} className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold text-gray-700">{k}:</span> {v}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex">
          {([
            { id: 'home', icon: Heart, label: '홈' },
            { id: 'records', icon: FileText, label: '진료기록' },
            { id: 'questionnaire', icon: ClipboardList, label: '문진표' },
            { id: 'education', icon: BookOpen, label: '교육' },
          ] as const).map(t => {
            const Icon = t.icon
            const active = tab === t.id || (t.id === 'records' && selectedRecord)
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedRecord(null) }}
                className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
                  active ? 'text-teal-600' : 'text-gray-400'
                }`}>
                <Icon className="w-5 h-5 mb-0.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function MenuCard({ icon: Icon, label, desc, color, onClick }: {
  icon: typeof FileText; label: string; desc: string; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-teal-200 hover:shadow-sm transition-all">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-semibold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </button>
  )
}

function Section({ icon: Icon, title, color, children }: {
  icon: typeof Heart; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  )
}
