'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Phone,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Mic,
  Loader2,
  Plus,
  Bell,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

interface Appointment {
  id: string
  patient_name: string
  patient_phone: string | null
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  department: string
  doctor_name: string | null
  reason: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  source: string
  call_transcript: string | null
  ai_extracted: Record<string, unknown>
  confirmed_by: string | null
  confirmed_at: string | null
  notes: string | null
  created_at: string
}

const STATUS_CONFIG = {
  pending: { label: '대기', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  confirmed: { label: '확정', color: 'bg-teal-100 text-teal-700', dot: 'bg-teal-400' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  completed: { label: '완료', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9) // 9시~19시

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekBase, setWeekBase] = useState(new Date())
  const [showCallRecorder, setShowCallRecorder] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [pendingAppointment, setPendingAppointment] = useState<Partial<Appointment> | null>(null)
  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase])

  // 예약 불러오기
  const fetchAppointments = useCallback(async () => {
    try {
      const startDate = formatDate(weekDates[0])
      const endDate = formatDate(weekDates[6])
      const res = await fetch(`/api/appointments?start_date=${startDate}&end_date=${endDate}`)
      const data = await res.json()
      if (data.appointments) setAppointments(data.appointments)
    } catch (error) {
      console.error('Fetch appointments error:', error)
    }
  }, [weekDates])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // 예약 확인
  const confirmAppointment = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'confirmed', confirmed_by: '간호사' }),
      })
      if (res.ok) {
        toast.success('예약이 확정되었습니다')
        fetchAppointments()
      }
    } catch { toast.error('확정 실패') }
  }, [fetchAppointments])

  // 예약 취소
  const cancelAppointment = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      })
      if (res.ok) {
        toast.success('예약이 취소되었습니다')
        fetchAppointments()
      }
    } catch { toast.error('취소 실패') }
  }, [fetchAppointments])

  // 통화 내용 → 예약 파싱
  const parseCallAndCreateAppointment = useCallback(async (transcript: string) => {
    setProcessing(true)
    try {
      // AI 파싱
      const parseRes = await fetch('/api/parse-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!parseRes.ok) throw new Error('통화 분석 실패')
      const { data } = await parseRes.json()

      // 대기 상태로 예약 생성
      const createRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: data.patient_name || '미확인 환자',
          patient_phone: data.patient_phone,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          duration_minutes: data.duration_minutes || 30,
          reason: data.reason,
          doctor_name: data.doctor_name,
          source: 'call',
          status: 'pending',
          call_transcript: transcript,
          ai_extracted: data,
        }),
      })
      if (!createRes.ok) throw new Error('예약 저장 실패')
      const result = await createRes.json()

      setPendingAppointment(result.appointment)
      setShowCallRecorder(false)
      toast.success('통화 분석 완료! 예약 정보를 확인해주세요.')
      fetchAppointments()
    } catch (error) {
      console.error('Parse call error:', error)
      toast.error('통화 분석에 실패했습니다')
    } finally {
      setProcessing(false)
    }
  }, [fetchAppointments])

  // 수동 예약 추가
  const handleManualAdd = useCallback(async () => {
    const name = prompt('환자 이름:')
    if (!name) return
    const time = prompt('예약 시간 (예: 14:00):')
    if (!time) return
    const reason = prompt('사유 (선택):') || ''

    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: name,
          appointment_date: formatDate(selectedDate),
          appointment_time: time,
          reason,
          source: 'walk_in',
          status: 'confirmed',
        }),
      })
      toast.success('예약 추가됨')
      fetchAppointments()
    } catch { toast.error('추가 실패') }
  }, [selectedDate, fetchAppointments])

  const todayStr = formatDate(new Date())
  const selectedStr = formatDate(selectedDate)
  const dayAppointments = appointments.filter(a => a.appointment_date === selectedStr)
  const pendingCount = appointments.filter(a => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-ghost p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-600" />
              <h1 className="text-lg font-semibold text-gray-900">예약 캘린더</h1>
            </div>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full animate-pulse">
                <Bell className="w-3 h-3" />
                대기 {pendingCount}건
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCallRecorder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
              통화 녹음
            </button>
            <button onClick={handleManualAdd} className="btn-ghost text-sm py-2 px-3">
              <Plus className="w-4 h-4" />
              수동 추가
            </button>
            <Link href="/demo" className="btn-ghost text-sm py-2 px-3">진료실</Link>
            <Link href="/counselor" className="btn-ghost text-sm py-2 px-3">상담사</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left - Week View */}
          <div className="lg:col-span-3">
            {/* Week Navigation */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d) }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                <span className="font-semibold text-gray-900">
                  {weekDates[0].toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} — {weekDates[6].toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
                <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d) }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7">
                {weekDates.map((date) => {
                  const dateStr = formatDate(date)
                  const isToday = dateStr === todayStr
                  const isSelected = dateStr === selectedStr
                  const dayAppts = appointments.filter(a => a.appointment_date === dateStr)
                  const pendingDay = dayAppts.filter(a => a.status === 'pending').length

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 border-r border-b border-gray-100 last:border-r-0 text-center transition-colors ${
                        isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-[10px] text-gray-400 uppercase">
                        {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${
                        isToday ? 'text-teal-600' : isSelected ? 'text-teal-700' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </p>
                      {dayAppts.length > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-500">{dayAppts.length}건</span>
                          {pendingDay > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Day Schedule */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                </h2>
                <span className="text-sm text-gray-500">{dayAppointments.length}건의 예약</span>
              </div>

              <div className="divide-y divide-gray-50">
                {HOURS.map(hour => {
                  const hourStr = `${hour.toString().padStart(2, '0')}:`
                  const hourAppts = dayAppointments.filter(a => a.appointment_time.startsWith(hourStr))

                  return (
                    <div key={hour} className="flex min-h-[60px]">
                      <div className="w-16 shrink-0 px-3 py-2 text-xs text-gray-400 font-medium border-r border-gray-100">
                        {hour}:00
                      </div>
                      <div className="flex-1 p-2 space-y-1">
                        {hourAppts.map(appt => {
                          const sc = STATUS_CONFIG[appt.status]
                          return (
                            <div key={appt.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                              appt.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'
                            }`}>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{appt.patient_name}</span>
                                  <span className="text-xs text-gray-400">{appt.appointment_time}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sc.color}`}>{sc.label}</span>
                                </div>
                                {appt.reason && <p className="text-xs text-gray-500 truncate">{appt.reason}</p>}
                              </div>
                              {appt.status === 'pending' && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => confirmAppointment(appt.id)}
                                    className="p-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg transition-colors" title="확정">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => cancelAppointment(appt.id)}
                                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors" title="취소">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right - Pending Queue */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pending Confirmation */}
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  확인 대기 ({pendingCount}건)
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {appointments.filter(a => a.status === 'pending').length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">대기 중인 예약이 없습니다</div>
                ) : (
                  appointments.filter(a => a.status === 'pending').map(appt => (
                    <div key={appt.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">{appt.patient_name}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(appt.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                        <p>{appt.appointment_date} {appt.appointment_time}</p>
                        {appt.reason && <p>{appt.reason}</p>}
                        {appt.patient_phone && <p>{appt.patient_phone}</p>}
                      </div>
                      {appt.call_transcript && (
                        <details className="mb-3">
                          <summary className="text-[10px] text-blue-600 cursor-pointer">통화 내용 보기</summary>
                          <p className="mt-1 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg max-h-20 overflow-y-auto">
                            {appt.call_transcript}
                          </p>
                        </details>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => confirmAppointment(appt.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors">
                          <Check className="w-3.5 h-3.5" /> 확정
                        </button>
                        <button onClick={() => cancelAppointment(appt.id)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today's Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">오늘 요약</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  const count = appointments.filter(a => a.appointment_date === todayStr && a.status === key).length
                  return (
                    <div key={key} className="p-2 rounded-lg bg-gray-50 text-center">
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className={`text-[10px] font-medium ${config.color} px-1.5 py-0.5 rounded inline-block`}>{config.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Call Recorder Modal */}
      {showCallRecorder && (
        <CallRecorderModal
          onClose={() => setShowCallRecorder(false)}
          onTranscriptReady={parseCallAndCreateAppointment}
          processing={processing}
        />
      )}

      {/* Pending Appointment Review Modal */}
      {pendingAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPendingAppointment(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              새 예약 확인
            </h3>
            <div className="space-y-3 mb-6">
              <InfoRow2 label="환자" value={pendingAppointment.patient_name || ''} />
              <InfoRow2 label="전화" value={pendingAppointment.patient_phone || '-'} />
              <InfoRow2 label="날짜" value={pendingAppointment.appointment_date || ''} />
              <InfoRow2 label="시간" value={pendingAppointment.appointment_time || ''} />
              <InfoRow2 label="사유" value={pendingAppointment.reason || '-'} />
              <InfoRow2 label="의사" value={pendingAppointment.doctor_name || '-'} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { confirmAppointment(pendingAppointment.id!); setPendingAppointment(null) }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors">
                <Check className="w-4 h-4" /> 예약 확정
              </button>
              <button onClick={() => setPendingAppointment(null)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                나중에
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 통화 녹음 모달
function CallRecorderModal({
  onClose,
  onTranscriptReady,
  processing,
}: {
  onClose: () => void
  onTranscriptReady: (transcript: string) => void
  processing: boolean
}) {
  const { state, duration, transcript, interimTranscript, startRecording, stopRecording } = useAudioRecorder()
  const [manualInput, setManualInput] = useState('')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = () => {
    const text = transcript || manualInput
    if (text.length < 5) {
      toast.error('통화 내용이 너무 짧습니다')
      return
    }
    onTranscriptReady(text)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-500" />
            통화 녹음 → 예약 자동 등록
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Recorder */}
        <div className="text-center mb-6">
          {state === 'idle' && (
            <div className="space-y-4">
              <button onClick={startRecording} disabled={processing}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto transition-colors disabled:opacity-50">
                <Mic className="w-8 h-8" />
              </button>
              <p className="text-sm text-gray-500">통화 시작 시 녹음 버튼을 누르세요</p>
            </div>
          )}
          {state === 'recording' && (
            <div className="space-y-4">
              <div className="relative inline-block">
                <div className="absolute -inset-2 rounded-full bg-red-100 animate-pulse" />
                <button onClick={stopRecording}
                  className="relative w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-sm" />
                </button>
              </div>
              <div className="text-2xl font-semibold text-red-500 tabular-nums">{formatDuration(duration)}</div>
              <p className="text-sm text-red-500 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 녹음 중
              </p>
            </div>
          )}
          {state === 'stopped' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-teal-600">녹음 완료 ({formatDuration(duration)})</p>
            </div>
          )}
        </div>

        {/* 실시간 자막 */}
        {(transcript || interimTranscript) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
            <p className="text-xs text-gray-400 mb-1">음성 인식</p>
            <p className="text-sm text-gray-700">
              {transcript}
              {interimTranscript && <span className="text-gray-400"> {interimTranscript}</span>}
            </p>
          </div>
        )}

        {/* 수동 입력 */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">또는 통화 내용 직접 입력:</p>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="예: 김철수 환자, 내일 오후 2시에 허리 때문에 예약하고 싶다고 하셨어요"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* 제출 */}
        <button onClick={handleSubmit} disabled={processing || (!transcript && manualInput.length < 5)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
          {processing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AI 분석 중...</>
          ) : (
            <><MessageSquare className="w-4 h-4" /> 예약 정보 추출</>
          )}
        </button>
      </div>
    </div>
  )
}

function InfoRow2({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-10 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  )
}
