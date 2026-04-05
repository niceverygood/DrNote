'use client'

import { useState } from 'react'
import { Star, Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { PrescriptionSet, Medication } from '@/lib/prescriptions'

const STORAGE_KEY = 'drnote-favorite-rx'

export interface FavoriteRx {
  id: string
  name: string
  keywords: string[]
  medications: Medication[]
  additionalNote?: string
}

function loadFavorites(): FavoriteRx[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveFavorites(favs: FavoriteRx[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
}

interface FavoritePrescriptionsProps {
  diagnoses: string[]
  plans: string[]
}

export function FavoritePrescriptions({ diagnoses, plans }: FavoritePrescriptionsProps) {
  const [favorites, setFavorites] = useState<FavoriteRx[]>(() => loadFavorites())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 키워드 매칭으로 관련 즐겨찾기 먼저 표시
  const sortedFavorites = [...favorites].sort((a, b) => {
    const combined = [...diagnoses, ...plans].join(' ').toLowerCase()
    const scoreA = a.keywords.reduce((s, k) => s + (combined.includes(k.toLowerCase()) ? 1 : 0), 0)
    const scoreB = b.keywords.reduce((s, k) => s + (combined.includes(k.toLowerCase()) ? 1 : 0), 0)
    return scoreB - scoreA
  })

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id)
    setFavorites(updated)
    saveFavorites(updated)
    toast.success('즐겨찾기에서 삭제됨')
  }

  const copyRx = (rx: FavoriteRx) => {
    const text = [
      `[${rx.name}]`,
      ...rx.medications.map(m =>
        `${m.nameKo} (${m.name}) ${m.dose} ${m.frequency} ${m.duration}${m.note ? ` - ${m.note}` : ''}`
      ),
      rx.additionalNote ? `\n※ ${rx.additionalNote}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedId(rx.id)
    toast.success('처방 복사됨')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (favorites.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-yellow-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-yellow-50 border-b border-yellow-100">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-600 fill-yellow-400" />
          <span className="font-semibold text-yellow-900 text-sm">나의 처방 세트</span>
          <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full">
            {favorites.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {sortedFavorites.map((rx) => {
          const combined = [...diagnoses, ...plans].join(' ').toLowerCase()
          const isRelevant = rx.keywords.some(k => combined.includes(k.toLowerCase()))

          return (
            <div
              key={rx.id}
              className={`px-4 py-3 transition-colors ${isRelevant ? 'bg-yellow-50/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isRelevant && <Star className="w-3 h-3 text-yellow-500 fill-yellow-400" />}
                  <span className="text-sm font-medium text-gray-900">{rx.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyRx(rx)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                  >
                    {copiedId === rx.id ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => removeFavorite(rx.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                {rx.medications.slice(0, 3).map((m, i) => (
                  <p key={i}>{m.nameKo} {m.dose} {m.frequency}</p>
                ))}
                {rx.medications.length > 3 && (
                  <p className="text-gray-400">외 {rx.medications.length - 3}개...</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 처방 추천에서 즐겨찾기 추가 버튼 (외부에서 사용)
export function AddToFavoriteButton({ prescriptionSet }: { prescriptionSet: PrescriptionSet }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    const favs = loadFavorites()
    const newFav: FavoriteRx = {
      id: `fav_${Date.now()}`,
      name: prescriptionSet.nameKo,
      keywords: prescriptionSet.keywords.slice(0, 5),
      medications: prescriptionSet.medications,
      additionalNote: prescriptionSet.additionalNote,
    }
    saveFavorites([...favs, newFav])
    setAdded(true)
    toast.success(`"${prescriptionSet.nameKo}" 즐겨찾기 추가됨`)

    // Force re-render of FavoritePrescriptions by dispatching storage event
    window.dispatchEvent(new Event('storage'))
  }

  if (added) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-yellow-600">
        <Star className="w-3 h-3 fill-yellow-400" /> 추가됨
      </span>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-yellow-600 transition-colors"
      title="즐겨찾기에 추가"
    >
      <Star className="w-3 h-3" />
    </button>
  )
}
