'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, Shield, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { matchInsuranceCodes } from '@/lib/insurance-codes'
import type { KCDCode, EDICode } from '@/lib/insurance-codes'

interface InsuranceCodesProps {
  diagnoses: string[]
  plans: string[]
}

export function InsuranceCodes({ diagnoses, plans }: InsuranceCodesProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const { kcd, edi } = useMemo(
    () => matchInsuranceCodes(diagnoses, plans),
    [diagnoses, plans]
  )

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`${label} 복사됨`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const copyAllKCD = () => {
    const text = kcd.map(c => `${c.code} ${c.nameKo}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('KCD 코드 전체 복사됨')
  }

  const copyAllEDI = () => {
    const text = edi.map(c => `${c.code} ${c.nameKo}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('EDI 코드 전체 복사됨')
  }

  if (kcd.length === 0 && edi.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-indigo-900">보험 청구 코드 추천</span>
          <span className="text-xs text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
            KCD {kcd.length} + EDI {edi.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-indigo-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-indigo-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* KCD 상병코드 */}
          {kcd.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-800">KCD 상병코드</h4>
                </div>
                <button
                  onClick={copyAllKCD}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  전체 복사
                </button>
              </div>
              <div className="space-y-1.5">
                {kcd.map((code) => (
                  <KCDCodeRow
                    key={code.code}
                    code={code}
                    copied={copiedCode === code.code}
                    onCopy={() => copyCode(code.code, code.code)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* EDI 수가코드 */}
          {edi.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-gray-800">EDI 수가코드</h4>
                </div>
                <button
                  onClick={copyAllEDI}
                  className="text-xs text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                >
                  전체 복사
                </button>
              </div>
              <div className="space-y-1.5">
                {edi.map((code) => (
                  <EDICodeRow
                    key={code.code}
                    code={code}
                    copied={copiedCode === code.code}
                    onCopy={() => copyCode(code.code, code.code)}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-2">
            * AI 추천 코드입니다. 실제 청구 시 반드시 확인하세요.
          </p>
        </div>
      )}
    </div>
  )
}

function KCDCodeRow({ code, copied, onCopy }: { code: KCDCode; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors group">
      <button
        onClick={onCopy}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 font-mono text-sm font-bold rounded-md hover:bg-blue-200 transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
        {code.code}
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800 font-medium">{code.nameKo}</span>
        <span className="text-xs text-gray-400 ml-2">{code.name}</span>
      </div>
    </div>
  )
}

function EDICodeRow({ code, copied, onCopy }: { code: EDICode; copied: boolean; onCopy: () => void }) {
  const categoryColors: Record<string, string> = {
    '처치': 'bg-orange-100 text-orange-700',
    '검사': 'bg-cyan-100 text-cyan-700',
    '물리치료': 'bg-green-100 text-green-700',
    '주사': 'bg-red-100 text-red-700',
    '영상': 'bg-violet-100 text-violet-700',
    '기타': 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors group">
      <button
        onClick={onCopy}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono text-sm font-bold rounded-md hover:bg-emerald-200 transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
        {code.code}
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800 font-medium">{code.nameKo}</span>
      </div>
      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[code.category] || categoryColors['기타']}`}>
        {code.category}
      </span>
    </div>
  )
}
