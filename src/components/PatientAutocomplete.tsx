'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { User, ChevronRight } from 'lucide-react'
import type { ChartStructured, ConsultationType, AdditionalInfo } from '@/types/database'

interface PatientRecord {
  id: string
  patient_name?: string
  chart_structured: ChartStructured | null
  consultation_type: ConsultationType
  note: string | null
  keywords: string[]
  additional_info?: AdditionalInfo | null
  created_at: string
}

interface PatientAutocompleteProps {
  value: string
  onChange: (name: string) => void
  records: PatientRecord[]
  onPatientSelect: (info: {
    name: string
    lastRecord: PatientRecord
    visitCount: number
    consultationType: ConsultationType
    additionalInfo?: AdditionalInfo | null
  }) => void
}

export function PatientAutocomplete({ value, onChange, records, onPatientSelect }: PatientAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 환자별 그룹핑 (이름 or CC 부위 기반)
  const patientGroups = useMemo(() => {
    const map = new Map<string, PatientRecord[]>()
    for (const r of records) {
      const key = r.patient_name || r.chart_structured?.cc?.replace(/pain|stiffness|f\/u|ache/gi, '').trim() || ''
      if (!key || key.length < 2) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }

    return Array.from(map.entries())
      .map(([name, recs]) => ({
        name,
        records: recs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        visitCount: recs.length,
      }))
      .sort((a, b) => new Date(b.records[0].created_at).getTime() - new Date(a.records[0].created_at).getTime())
  }, [records])

  // 검색 필터
  const filtered = useMemo(() => {
    if (!value) return patientGroups.slice(0, 8)
    const q = value.toLowerCase()
    return patientGroups
      .filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.records.some(r =>
          r.chart_structured?.diagnosis.some(d => d.toLowerCase().includes(q))
        )
      )
      .slice(0, 8)
  }, [value, patientGroups])

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (group: typeof patientGroups[0]) => {
    const lastRecord = group.records[0]
    onChange(group.name)
    setIsOpen(false)
    onPatientSelect({
      name: group.name,
      lastRecord,
      visitCount: group.visitCount,
      consultationType: 'follow_up', // 기존 환자 선택 = 재진
      additionalInfo: (lastRecord as unknown as Record<string, unknown>).additional_info as AdditionalInfo | null | undefined,
    })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="환자 이름"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => { setIsFocused(true); setIsOpen(true) }}
          onBlur={() => setIsFocused(false)}
          className={`w-36 pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors ${
            isFocused ? 'border-teal-300' : 'border-gray-200'
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] text-gray-500 font-medium">
              {value ? `"${value}" 검색 결과` : '최근 환자'}
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((group) => {
              const last = group.records[0]
              const cs = last.chart_structured
              return (
                <button
                  key={group.name}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(group) }}
                  className="w-full text-left px-3 py-2.5 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{group.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded font-medium">
                        {group.visitCount}회
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  {cs && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {cs.diagnosis.join(', ')} · {new Date(last.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
