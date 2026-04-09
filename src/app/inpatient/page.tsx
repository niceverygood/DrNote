'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Bed, Mic, Square, FileText, ClipboardList,
  Stethoscope, LogOut, Loader2, Copy, X, ChevronRight,
  User, Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { NOTE_TYPE_LABELS } from '@/lib/inpatient-prompts'
import type { InpatientNoteType } from '@/lib/inpatient-prompts'

interface Inpatient {
  id: string
  patient_name: string
  patient_age: number | null
  patient_gender: string | null
  room_number: string | null
  bed_number: string | null
  admission_date: string
  discharge_date: string | null
  attending_doctor: string | null
  admission_diagnosis: string | null
  status: string
  created_at: string
}

interface InpatientNote {
  id: string
  inpatient_id: string
  note_type: InpatientNoteType
  note_date: string
  content: Record<string, unknown>
  transcript: string | null
  created_at: string
}

const NOTE_ICONS: Record<InpatientNoteType, typeof FileText> = {
  admission: ClipboardList,
  progress: Activity,
  operative: Stethoscope,
  discharge: LogOut,
}

const NOTE_COLORS: Record<InpatientNoteType, string> = {
  admission: 'bg-blue-100 text-blue-700',
  progress: 'bg-green-100 text-green-700',
  operative: 'bg-red-100 text-red-700',
  discharge: 'bg-purple-100 text-purple-700',
}

export default function InpatientPage() {
  const [patients, setPatients] = useState<Inpatient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Inpatient | null>(null)
  const [notes, setNotes] = useState<InpatientNote[]>([])
  const [showAdmitForm, setShowAdmitForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteType, setNoteType] = useState<InpatientNoteType>('progress')
  const [processing, setProcessing] = useState(false)
  const [generatedNote, setGeneratedNote] = useState<Record<string, unknown> | null>(null)

  // 입원 등록 폼
  const [admitForm, setAdmitForm] = useState({
    patient_name: '', patient_age: '', patient_gender: 'M',
    room_number: '', bed_number: '', attending_doctor: '', admission_diagnosis: '',
  })

  // 환자 목록 로드
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/inpatient?status=admitted')
      const data = await res.json()
      if (data.patients) setPatients(data.patients)
    } catch (error) { console.error('Fetch error:', error) }
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  // 환자 선택 → 기록 로드
  const selectPatient = useCallback(async (patient: Inpatient) => {
    setSelectedPatient(patient)
    setGeneratedNote(null)
    try {
      const res = await fetch(`/api/inpatient?patient_id=${patient.id}`)
      const data = await res.json()
      if (data.notes) setNotes(data.notes)
    } catch (error) { console.error('Notes fetch error:', error) }
  }, [])

  // 입원 등록
  const handleAdmit = useCallback(async () => {
    if (!admitForm.patient_name) { toast.error('환자명은 필수입니다'); return }
    try {
      const res = await fetch('/api/inpatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admit', ...admitForm, patient_age: admitForm.patient_age ? Number(admitForm.patient_age) : null }),
      })
      if (res.ok) {
        toast.success('입원 등록 완료')
        setShowAdmitForm(false)
        setAdmitForm({ patient_name: '', patient_age: '', patient_gender: 'M', room_number: '', bed_number: '', attending_doctor: '', admission_diagnosis: '' })
        fetchPatients()
      }
    } catch { toast.error('등록 실패') }
  }, [admitForm, fetchPatients])

  // AI 기록 생성
  const generateNote = useCallback(async (transcript: string) => {
    if (!selectedPatient || !transcript) return
    setProcessing(true)
    try {
      const context = `환자: ${selectedPatient.patient_name} (${selectedPatient.patient_age || ''}세/${selectedPatient.patient_gender || ''})\n병실: ${selectedPatient.room_number || ''}\n입원일: ${selectedPatient.admission_date}\n입원진단: ${selectedPatient.admission_diagnosis || ''}`
      const res = await fetch('/api/inpatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_note',
          inpatient_id: selectedPatient.id,
          note_type: noteType,
          transcript,
          context,
        }),
      })
      if (!res.ok) throw new Error('생성 실패')
      const data = await res.json()
      setGeneratedNote(data.note.content)
      setShowNoteForm(false)
      toast.success(`${NOTE_TYPE_LABELS[noteType]} 생성 완료`)
      selectPatient(selectedPatient) // 기록 새로고침
    } catch { toast.error('기록 생성 실패') }
    finally { setProcessing(false) }
  }, [selectedPatient, noteType, selectPatient])

  // 퇴원
  const handleDischarge = useCallback(async () => {
    if (!selectedPatient) return
    if (!confirm(`${selectedPatient.patient_name} 환자를 퇴원 처리하시겠습니까?`)) return
    try {
      await fetch('/api/inpatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discharge', inpatient_id: selectedPatient.id }),
      })
      toast.success('퇴원 처리 완료')
      setSelectedPatient(null)
      fetchPatients()
    } catch { toast.error('퇴원 처리 실패') }
  }, [selectedPatient, fetchPatients])

  // 복사
  const copyNote = (note: Record<string, unknown>) => {
    const text = Object.entries(note)
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${v.join(', ')}`
        return `${k}: ${v}`
      })
      .join('\n')
    navigator.clipboard.writeText(text)
    toast.success('복사됨')
  }

  const daysSinceAdmission = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-semibold text-gray-900">병동 관리</h1>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {patients.length}명 입원 중
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdmitForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> 입원 등록
            </button>
            <Link href="/demo" className="btn-ghost text-sm py-2 px-3">외래</Link>
            <Link href="/calendar" className="btn-ghost text-sm py-2 px-3">예약</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left - Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50">
                <h2 className="font-semibold text-indigo-900 text-sm">입원 환자</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-[calc(100vh-180px)] overflow-y-auto">
                {patients.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400">입원 환자가 없습니다</div>
                )}
                {patients.map(p => (
                  <button key={p.id} onClick={() => selectPatient(p)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedPatient?.id === p.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{p.patient_name}</span>
                        <span className="text-[10px] text-gray-400">{p.patient_age || ''}세/{p.patient_gender || ''}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{p.room_number || '미배정'}호</span>
                      <span>·</span>
                      <span>HD #{daysSinceAdmission(p.admission_date)}</span>
                    </div>
                    {p.admission_diagnosis && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{p.admission_diagnosis}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Patient Detail */}
          <div className="lg:col-span-3">
            {!selectedPatient ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">왼쪽에서 환자를 선택하세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Patient Info Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{selectedPatient.patient_name}
                          <span className="text-sm font-normal text-gray-500 ml-2">{selectedPatient.patient_age}세 / {selectedPatient.patient_gender}</span>
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          <span>{selectedPatient.room_number || '미배정'}호 {selectedPatient.bed_number || ''}</span>
                          <span>·</span>
                          <span>HD #{daysSinceAdmission(selectedPatient.admission_date)}</span>
                          <span>·</span>
                          <span>{selectedPatient.admission_diagnosis || ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowNoteForm(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors">
                        <Mic className="w-4 h-4" /> 기록 작성
                      </button>
                      <button onClick={handleDischarge}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> 퇴원
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generated Note */}
                {generatedNote && (
                  <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-teal-50 border-b border-teal-100">
                      <span className="font-semibold text-teal-900 text-sm">AI 생성 기록</span>
                      <button onClick={() => copyNote(generatedNote)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors">
                        <Copy className="w-3.5 h-3.5" /> 전체 복사
                      </button>
                    </div>
                    <div className="p-5 space-y-2">
                      {Object.entries(generatedNote).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null
                        const displayValue = Array.isArray(value) ? value.join('\n') : String(value)
                        return (
                          <div key={key} className="flex gap-3">
                            <span className="shrink-0 text-xs font-bold text-gray-500 w-24 uppercase pt-0.5">{key}</span>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{displayValue}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Notes History */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">기록 히스토리 ({notes.length}건)</h3>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                    {notes.length === 0 && (
                      <div className="p-8 text-center text-sm text-gray-400">작성된 기록이 없습니다</div>
                    )}
                    {notes.map(note => {
                      const Icon = NOTE_ICONS[note.note_type] || FileText
                      const color = NOTE_COLORS[note.note_type] || 'bg-gray-100 text-gray-600'
                      const content = note.content as Record<string, unknown>
                      return (
                        <div key={note.id} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${color}`}>
                                <Icon className="w-3 h-3" />
                                {NOTE_TYPE_LABELS[note.note_type]}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(note.note_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <button onClick={() => copyNote(content)}
                              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                              <Copy className="w-3 h-3" /> 복사
                            </button>
                          </div>
                          <div className="text-sm text-gray-700 space-y-0.5">
                            {Object.entries(content).slice(0, 4).map(([k, v]) => {
                              if (!v) return null
                              const display = Array.isArray(v) ? v.join(', ') : String(v)
                              return (
                                <p key={k} className="truncate">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{k}:</span> {display}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 입원 등록 모달 */}
      {showAdmitForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdmitForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> 입원 등록
            </h3>
            <div className="space-y-3">
              <input placeholder="환자명 *" value={admitForm.patient_name}
                onChange={e => setAdmitForm(f => ({ ...f, patient_name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="나이" value={admitForm.patient_age}
                  onChange={e => setAdmitForm(f => ({ ...f, patient_age: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <select value={admitForm.patient_gender}
                  onChange={e => setAdmitForm(f => ({ ...f, patient_gender: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="M">남</option><option value="F">여</option>
                </select>
                <input placeholder="병실호수" value={admitForm.room_number}
                  onChange={e => setAdmitForm(f => ({ ...f, room_number: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <input placeholder="주치의" value={admitForm.attending_doctor}
                onChange={e => setAdmitForm(f => ({ ...f, attending_doctor: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="입원 진단" value={admitForm.admission_diagnosis}
                onChange={e => setAdmitForm(f => ({ ...f, admission_diagnosis: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleAdmit}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                등록
              </button>
              <button onClick={() => setShowAdmitForm(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기록 작성 모달 */}
      {showNoteForm && selectedPatient && (
        <NoteFormModal
          patient={selectedPatient}
          noteType={noteType}
          onNoteTypeChange={setNoteType}
          onSubmit={generateNote}
          onClose={() => setShowNoteForm(false)}
          processing={processing}
        />
      )}
    </div>
  )
}

// 기록 작성 모달
function NoteFormModal({ patient, noteType, onNoteTypeChange, onSubmit, onClose, processing }: {
  patient: Inpatient
  noteType: InpatientNoteType
  onNoteTypeChange: (t: InpatientNoteType) => void
  onSubmit: (transcript: string) => void
  onClose: () => void
  processing: boolean
}) {
  const { state, duration, transcript, interimTranscript, startRecording, stopRecording } = useAudioRecorder()
  const [manualInput, setManualInput] = useState('')

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleSubmit = () => {
    const text = transcript || manualInput
    if (text.length < 5) { toast.error('내용이 너무 짧습니다'); return }
    onSubmit(text)
  }

  const noteTypes: InpatientNoteType[] = ['admission', 'progress', 'operative', 'discharge']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{patient.patient_name} — 기록 작성</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* 기록 유형 선택 */}
        <div className="flex gap-2 mb-5">
          {noteTypes.map(t => {
            const Icon = NOTE_ICONS[t]
            const isActive = noteType === t
            return (
              <button key={t} onClick={() => onNoteTypeChange(t)}
                className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                  isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />
                {NOTE_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* 녹음 */}
        <div className="text-center mb-4">
          {state === 'idle' && (
            <button onClick={startRecording} disabled={processing}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto transition-colors disabled:opacity-50">
              <Mic className="w-7 h-7" />
            </button>
          )}
          {state === 'recording' && (
            <div className="space-y-2">
              <div className="relative inline-block">
                <div className="absolute -inset-2 rounded-full bg-red-100 animate-pulse" />
                <button onClick={stopRecording}
                  className="relative w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <Square className="w-6 h-6" />
                </button>
              </div>
              <p className="text-xl font-semibold text-red-500 tabular-nums">{formatDuration(duration)}</p>
            </div>
          )}
          {state === 'stopped' && (
            <p className="text-sm text-teal-600 font-medium">녹음 완료 ({formatDuration(duration)})</p>
          )}
        </div>

        {(transcript || interimTranscript) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border max-h-24 overflow-y-auto">
            <p className="text-xs text-gray-400 mb-1">음성 인식</p>
            <p className="text-sm text-gray-700">{transcript}<span className="text-gray-400"> {interimTranscript}</span></p>
          </div>
        )}

        <textarea value={manualInput} onChange={e => setManualInput(e.target.value)}
          placeholder="또는 회진/수술 내용 직접 입력..."
          rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4" />

        <button onClick={handleSubmit} disabled={processing || (!transcript && manualInput.length < 5)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> AI 생성 중...</> :
            <><FileText className="w-4 h-4" /> {NOTE_TYPE_LABELS[noteType]} 생성</>}
        </button>
      </div>
    </div>
  )
}
