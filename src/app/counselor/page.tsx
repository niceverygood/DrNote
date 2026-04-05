'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { InsuranceCodes } from '@/components/InsuranceCodes'
import { PrescriptionPanel } from '@/components/PrescriptionPanel'
import {
  ArrowLeft,
  Users,
  Clock,
  MessageSquare,
  Stethoscope,
  ClipboardList,
  RefreshCw,
  ChevronRight,
  Copy,
  Check,
  Bell,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChartStructured, CounselorSummary } from '@/types/database'

interface CounselorRecord {
  id: string
  chart: string
  chart_structured: ChartStructured | null
  consultation_type: string
  counselor_summary: CounselorSummary | null
  keywords: string[]
  created_at: string
}

export default function CounselorPage() {
  const [records, setRecords] = useState<CounselorRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<CounselorRecord | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [newRecordAlert, setNewRecordAlert] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  // 초기 로드 + Supabase Realtime 구독
  useEffect(() => {
    let ignore = false

    // 초기 데이터 로드
    async function loadRecords() {
      try {
        const response = await fetch('/api/records')
        const data = await response.json()
        if (!ignore && data.records) {
          setRecords(data.records)
        }
      } catch (error) {
        console.error('Fetch records error:', error)
      }
    }
    loadRecords()

    // Realtime 구독
    if (!supabaseUrl || !supabaseKey) return
    const supabase = createBrowserClient(supabaseUrl, supabaseKey)

    const channel = supabase
      .channel('chart_records_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chart_records',
        },
        () => {
          setNewRecordAlert(true)
          loadRecords()
          toast.success('새 진료 기록이 도착했습니다!', {
            icon: <Bell className="w-4 h-4" />,
          })
        }
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [supabaseUrl, supabaseKey])

  const copyText = (section: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
    toast.success('복사됨')
  }

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
              <Users className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-semibold text-gray-900">상담사 뷰</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newRecordAlert && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">
                <Bell className="w-3 h-3" />
                새 기록
              </span>
            )}
            <button
              onClick={() => { fetchRecords(); setNewRecordAlert(false) }}
              className="btn-ghost text-sm py-2 px-3"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Record List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">진료 기록 목록</h2>
                <p className="text-xs text-gray-500 mt-1">{records.length}건의 기록</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                {records.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400">
                    진료 기록이 없습니다
                  </div>
                )}
                {records.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => { setSelectedRecord(record); setNewRecordAlert(false) }}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${
                      selectedRecord?.id === record.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                          record.consultation_type === 'follow_up'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-teal-100 text-teal-600'
                        }`}>
                          {record.consultation_type === 'follow_up' ? '재진' : '초진'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="font-mono text-sm text-gray-800 truncate mt-1">
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

          {/* Right - Detail View */}
          <div className="lg:col-span-2">
            {!selectedRecord ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">왼쪽에서 진료 기록을 선택하세요</p>
                <p className="text-sm text-gray-400 mt-1">의사가 새 차트를 생성하면 실시간으로 알림이 옵니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Chart Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-indigo-50">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-indigo-600" />
                      <h2 className="font-semibold text-indigo-900">진료 차트</h2>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        selectedRecord.consultation_type === 'follow_up'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}>
                        {selectedRecord.consultation_type === 'follow_up' ? '재진' : '초진'}
                      </span>
                    </div>
                  </div>
                  {selectedRecord.chart_structured ? (
                    <div className="divide-y divide-gray-100">
                      <InfoRow label="CC (주호소)" value={selectedRecord.chart_structured.cc} />
                      <InfoRow label="PI (현병력)" value={selectedRecord.chart_structured.pi} />
                      <InfoRow
                        label="Dx (진단)"
                        value={selectedRecord.chart_structured.diagnosis.join('\n')}
                        highlight
                      />
                      <InfoRow
                        label="Plan (계획)"
                        value={selectedRecord.chart_structured.plan.map(p => `- ${p}`).join('\n')}
                      />
                    </div>
                  ) : (
                    <div className="p-5">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.chart}</pre>
                    </div>
                  )}
                </div>

                {/* Counselor Summary */}
                {selectedRecord.counselor_summary && (
                  selectedRecord.counselor_summary.explanation ||
                  selectedRecord.counselor_summary.treatment_reason ||
                  selectedRecord.counselor_summary.treatment_items.length > 0
                ) && (
                  <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-indigo-900">상담사 안내 사항</h2>
                      </div>
                      <button
                        onClick={() => {
                          const cs = selectedRecord.counselor_summary!
                          const text = `[의사 설명]\n${cs.explanation}\n\n[치료 이유]\n${cs.treatment_reason}\n\n[치료 항목]\n${cs.treatment_items.map(t => `- ${t}`).join('\n')}`
                          copyText('counselor_all', text)
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                      >
                        {copiedSection === 'counselor_all' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        전체 복사
                      </button>
                    </div>
                    <div className="divide-y divide-indigo-50">
                      {selectedRecord.counselor_summary.explanation && (
                        <CounselorItem
                          icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
                          title="의사 설명 내용"
                          content={selectedRecord.counselor_summary.explanation}
                        />
                      )}
                      {selectedRecord.counselor_summary.treatment_reason && (
                        <CounselorItem
                          icon={<Stethoscope className="w-4 h-4 text-green-500" />}
                          title="치료 결정 사유"
                          content={selectedRecord.counselor_summary.treatment_reason}
                        />
                      )}
                      {selectedRecord.counselor_summary.treatment_items.length > 0 && (
                        <CounselorItem
                          icon={<ClipboardList className="w-4 h-4 text-purple-500" />}
                          title="치료 항목"
                          content={selectedRecord.counselor_summary.treatment_items.map(t => `- ${t}`).join('\n')}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Insurance Codes */}
                {selectedRecord.chart_structured && (
                  <InsuranceCodes
                    diagnoses={selectedRecord.chart_structured.diagnosis}
                    plans={selectedRecord.chart_structured.plan}
                  />
                )}

                {/* Prescriptions */}
                {selectedRecord.chart_structured && (
                  <PrescriptionPanel
                    diagnoses={selectedRecord.chart_structured.diagnosis}
                    plans={selectedRecord.chart_structured.plan}
                  />
                )}

                {/* Keywords */}
                {selectedRecord.keywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-500 mb-2">키워드</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecord.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className={`p-3 rounded-lg ${highlight ? 'bg-amber-50' : 'bg-gray-50'}`}>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{value || '-'}</p>
      </div>
    </div>
  )
}

function CounselorItem({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap pl-6">{content}</p>
    </div>
  )
}
