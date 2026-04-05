'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, Pill, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { matchPrescriptions } from '@/lib/prescriptions'
import { AddToFavoriteButton } from '@/components/FavoritePrescriptions'
import type { PrescriptionSet, Medication } from '@/lib/prescriptions'

interface PrescriptionPanelProps {
  diagnoses: string[]
  plans: string[]
}

export function PrescriptionPanel({ diagnoses, plans }: PrescriptionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const matchedSets = useMemo(
    () => matchPrescriptions(diagnoses, plans),
    [diagnoses, plans]
  )

  if (matchedSets.length === 0) return null

  const copyPrescription = (set: PrescriptionSet) => {
    const lines = [
      `[${set.nameKo} 처방]`,
      '',
      ...set.medications.map(m =>
        `${m.nameKo} (${m.name}) ${m.dose} ${m.frequency} ${m.duration}${m.note ? ` - ${m.note}` : ''}`
      ),
    ]
    if (set.additionalNote) {
      lines.push('', `※ ${set.additionalNote}`)
    }
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedId(set.name)
    toast.success('처방 복사됨')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyAll = () => {
    const lines = matchedSets.flatMap(set => [
      `[${set.nameKo} 처방]`,
      ...set.medications.map(m =>
        `  ${m.nameKo} (${m.name}) ${m.dose} ${m.frequency} ${m.duration}${m.note ? ` - ${m.note}` : ''}`
      ),
      set.additionalNote ? `  ※ ${set.additionalNote}` : '',
      '',
    ])
    navigator.clipboard.writeText(lines.join('\n').trim())
    toast.success('전체 처방 복사됨')
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-rose-50 hover:bg-rose-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-rose-600" />
          <span className="font-semibold text-rose-900">스마트 처방 추천</span>
          <span className="text-xs text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">
            {matchedSets.length}개 세트
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-rose-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-rose-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {matchedSets.map((set) => (
            <PrescriptionSetCard
              key={set.name}
              set={set}
              copied={copiedId === set.name}
              onCopy={() => copyPrescription(set)}
            />
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              AI 추천입니다. 환자 상태에 따라 조정하세요.
            </p>
            <button
              onClick={copyAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              전체 복사
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PrescriptionSetCard({ set, copied, onCopy }: { set: PrescriptionSet; copied: boolean; onCopy: () => void }) {
  const categoryColors: Record<string, string> = {
    '진통소염제': 'bg-blue-100 text-blue-700',
    '근이완제': 'bg-purple-100 text-purple-700',
    '위장보호제': 'bg-green-100 text-green-700',
    '외용제': 'bg-amber-100 text-amber-700',
    '신경병증약': 'bg-pink-100 text-pink-700',
    '골다공증약': 'bg-cyan-100 text-cyan-700',
    '기타': 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">{set.nameKo}</span>
        <div className="flex items-center gap-1.5">
          <AddToFavoriteButton prescriptionSet={set} />
          <button
            onClick={onCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {set.medications.map((med, i) => (
          <MedicationRow key={i} medication={med} categoryColor={categoryColors[med.category] || categoryColors['기타']} />
        ))}
      </div>
      {set.additionalNote && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Tip:</span> {set.additionalNote}
          </p>
        </div>
      )}
    </div>
  )
}

function MedicationRow({ medication, categoryColor }: { medication: Medication; categoryColor: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColor}`}>
        {medication.category}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-gray-900">{medication.nameKo}</span>
          <span className="text-xs text-gray-400">{medication.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span className="font-mono">{medication.dose}</span>
          <span>·</span>
          <span>{medication.frequency}</span>
          <span>·</span>
          <span>{medication.duration}</span>
          {medication.note && (
            <>
              <span>·</span>
              <span className="text-amber-600">{medication.note}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
