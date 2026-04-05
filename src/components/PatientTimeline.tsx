'use client'

import { useState, useMemo } from 'react'
import {
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  X,
  Search,
  Pill,
  Shield,
} from 'lucide-react'
import type { ChartStructured, CounselorSummary, ConsultationType } from '@/types/database'
import { matchInsuranceCodes } from '@/lib/insurance-codes'
import { matchPrescriptions } from '@/lib/prescriptions'

interface TimelineRecord {
  id: string
  transcript: string
  chart: string
  chart_structured: ChartStructured | null
  note: string | null
  keywords: string[]
  consultation_type: ConsultationType
  counselor_summary: CounselorSummary | null
  created_at: string
  patient_name?: string
}

interface PatientTimelineProps {
  records: TimelineRecord[]
  currentRecordId?: string
  onSelectRecord: (record: TimelineRecord) => void
}

interface PatientGroup {
  name: string
  records: TimelineRecord[]
}

// 환자 이름 추출 (CC에서 부위 기반 그룹핑)
function extractPatientKey(record: TimelineRecord): string {
  if (record.patient_name) return record.patient_name

  // CC에서 부위 추출 (예: "Rt elbow pain" → "Rt elbow")
  const cc = record.chart_structured?.cc || ''
  const bodyPart = cc
    .replace(/pain|stiffness|f\/u|ache|discomfort|numbness|tingling/gi, '')
    .trim()

  return bodyPart || '미분류'
}

// 두 기록 간 변화 비교
function compareRecords(prev: TimelineRecord, curr: TimelineRecord) {
  const changes: { field: string; from: string; to: string; trend: 'improved' | 'worsened' | 'same' }[] = []

  const prevCs = prev.chart_structured
  const currCs = curr.chart_structured
  if (!prevCs || !currCs) return changes

  // CC 변화
  if (prevCs.cc !== currCs.cc) {
    changes.push({
      field: 'CC',
      from: prevCs.cc,
      to: currCs.cc,
      trend: currCs.cc.includes('f/u') ? 'improved' : 'same',
    })
  }

  // 진단 변화
  const prevDx = prevCs.diagnosis.join(', ')
  const currDx = currCs.diagnosis.join(', ')
  if (prevDx !== currDx) {
    changes.push({
      field: 'Dx',
      from: prevDx,
      to: currDx,
      trend: 'same',
    })
  }

  // Plan 변화
  const prevPlan = prevCs.plan.length
  const currPlan = currCs.plan.length
  if (prevPlan !== currPlan) {
    changes.push({
      field: 'Plan',
      from: `${prevPlan}개 항목`,
      to: `${currPlan}개 항목`,
      trend: currPlan < prevPlan ? 'improved' : 'same',
    })
  }

  // PI에서 호전/악화 키워드 감지
  const pi = currCs.pi.toLowerCase()
  if (pi.includes('호전') || pi.includes('나아') || pi.includes('감소') || pi.includes('줄었') || pi.includes('좋아')) {
    changes.push({ field: '경과', from: '', to: '호전 중', trend: 'improved' })
  } else if (pi.includes('악화') || pi.includes('심해') || pi.includes('증가') || pi.includes('더 아')) {
    changes.push({ field: '경과', from: '', to: '악화', trend: 'worsened' })
  }

  return changes
}

export function PatientTimeline({ records, currentRecordId, onSelectRecord }: PatientTimelineProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // 부위별 그룹핑
  const groups = useMemo(() => {
    const map = new Map<string, TimelineRecord[]>()
    for (const record of records) {
      const key = extractPatientKey(record)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(record)
    }

    const result: PatientGroup[] = []
    for (const [name, recs] of map) {
      if (recs.length >= 1) {
        result.push({
          name,
          records: recs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        })
      }
    }

    // 많은 기록 순
    return result.sort((a, b) => b.records.length - a.records.length)
  }, [records])

  // 검색 필터
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups
    const q = searchQuery.toLowerCase()
    return groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.records.some(r =>
        r.chart_structured?.cc.toLowerCase().includes(q) ||
        r.chart_structured?.diagnosis.some(d => d.toLowerCase().includes(q))
      )
    )
  }, [groups, searchQuery])

  const activeGroup = selectedGroup ? groups.find(g => g.name === selectedGroup) : null

  if (records.length === 0) return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-xl border border-cyan-200 transition-colors"
      >
        <Clock className="w-4 h-4" />
        환자 타임라인
        <span className="text-xs bg-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded-full">
          {groups.length}
        </span>
      </button>

      {/* Timeline Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setIsOpen(false); setSelectedGroup(null) }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-600" />
                <h2 className="text-lg font-bold text-gray-900">환자 타임라인</h2>
                <span className="text-sm text-gray-500">부위별 방문 기록 비교</span>
              </div>
              <button
                onClick={() => { setIsOpen(false); setSelectedGroup(null) }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="부위, 진단명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeGroup ? (
                /* Detail View */
                <div className="p-6">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-sm text-cyan-600 hover:text-cyan-800 mb-4 flex items-center gap-1"
                  >
                    ← 전체 목록
                  </button>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{activeGroup.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    총 {activeGroup.records.length}회 방문
                    {' · '}
                    {new Date(activeGroup.records[0].created_at).toLocaleDateString('ko-KR')} ~{' '}
                    {new Date(activeGroup.records[activeGroup.records.length - 1].created_at).toLocaleDateString('ko-KR')}
                  </p>

                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[18px] top-8 bottom-4 w-0.5 bg-cyan-200" />

                    <div className="space-y-4">
                      {activeGroup.records.map((record, idx) => {
                        const prevRecord = idx > 0 ? activeGroup.records[idx - 1] : null
                        const changes = prevRecord ? compareRecords(prevRecord, record) : []
                        const isCurrent = record.id === currentRecordId
                        const cs = record.chart_structured

                        return (
                          <div key={record.id} className="relative pl-10">
                            {/* Timeline Dot */}
                            <div className={`absolute left-2.5 top-3 w-4 h-4 rounded-full border-2 ${
                              isCurrent
                                ? 'bg-cyan-500 border-cyan-500'
                                : 'bg-white border-cyan-300'
                            }`} />

                            <button
                              onClick={() => {
                                onSelectRecord(record)
                                setIsOpen(false)
                                setSelectedGroup(null)
                              }}
                              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                                isCurrent
                                  ? 'border-cyan-300 bg-cyan-50'
                                  : 'border-gray-200 hover:border-cyan-200 hover:bg-cyan-50/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {idx + 1}회차
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                                    record.consultation_type === 'follow_up'
                                      ? 'bg-orange-100 text-orange-600'
                                      : 'bg-teal-100 text-teal-600'
                                  }`}>
                                    {record.consultation_type === 'follow_up' ? '재진' : '초진'}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded font-medium bg-cyan-100 text-cyan-700">현재</span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {new Date(record.created_at).toLocaleDateString('ko-KR', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              {cs && (() => {
                                const codes = matchInsuranceCodes(cs.diagnosis, cs.plan)
                                const rx = matchPrescriptions(cs.diagnosis, cs.plan)
                                return (
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex gap-2">
                                      <span className="shrink-0 text-xs font-bold text-blue-600 w-6">CC</span>
                                      <span className="text-gray-700">{cs.cc}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="shrink-0 text-xs font-bold text-amber-600 w-6">Dx</span>
                                      <span className="text-gray-700">{cs.diagnosis.join(', ')}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="shrink-0 text-xs font-bold text-purple-600 w-6">P</span>
                                      <span className="text-gray-700">{cs.plan.join(', ')}</span>
                                    </div>
                                    {/* 보험코드 + 처방 미니 요약 */}
                                    <div className="flex flex-wrap gap-1.5 mt-1 pt-1.5 border-t border-gray-100">
                                      {codes.kcd.slice(0, 3).map(c => (
                                        <span key={c.code} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">
                                          <Shield className="w-2.5 h-2.5" />
                                          {c.code}
                                        </span>
                                      ))}
                                      {rx.slice(0, 2).map(r => (
                                        <span key={r.name} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded">
                                          <Pill className="w-2.5 h-2.5" />
                                          {r.medications[0]?.nameKo}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Changes from previous visit */}
                              {changes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1.5">이전 방문 대비 변화</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {changes.map((change, ci) => (
                                      <span
                                        key={ci}
                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                          change.trend === 'improved'
                                            ? 'bg-green-50 text-green-700'
                                            : change.trend === 'worsened'
                                              ? 'bg-red-50 text-red-700'
                                              : 'bg-gray-50 text-gray-600'
                                        }`}
                                      >
                                        {change.trend === 'improved' && <TrendingUp className="w-3 h-3" />}
                                        {change.trend === 'worsened' && <TrendingDown className="w-3 h-3" />}
                                        {change.trend === 'same' && <Minus className="w-3 h-3" />}
                                        {change.field}
                                        {change.to && `: ${change.to}`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Group List */
                <div className="p-6">
                  {filteredGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>검색 결과가 없습니다</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {filteredGroups.map((group) => {
                        const lastRecord = group.records[group.records.length - 1]
                        const cs = lastRecord.chart_structured

                        return (
                          <button
                            key={group.name}
                            onClick={() => setSelectedGroup(group.name)}
                            className="text-left p-4 rounded-xl border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-cyan-600" />
                                </div>
                                <span className="font-semibold text-gray-900 text-sm">{group.name}</span>
                              </div>
                              <div className="flex items-center gap-1 text-cyan-600">
                                <span className="text-sm font-medium">{group.records.length}회</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>

                            {cs && (
                              <p className="text-xs text-gray-500 truncate">
                                최근: {cs.diagnosis.join(', ')}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-[11px] text-gray-400">
                                최근 {new Date(lastRecord.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                              {group.records.length > 1 && (
                                <span className="text-[11px] text-cyan-600">
                                  ({new Date(group.records[0].created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~)
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
