'use client'

import { useState } from 'react'
import { Copy, Check, FileText, MessageSquare, Tag } from 'lucide-react'

interface ChartData {
  chart: string
  note: string
  keywords: string[]
}

interface ChartResultProps {
  data: ChartData
  transcript?: string
}

export function ChartResult({ data, transcript }: ChartResultProps) {
  const [copied, setCopied] = useState(false)
  const [copiedFull, setCopiedFull] = useState(false)

  const handleCopy = () => {
    const text = `${data.chart}${data.note ? `\n-----\n${data.note}` : ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyFull = () => {
    const text = `[STT 원문]\n${transcript}\n\n[차트]\n${data.chart}${data.note ? `\n-----\n${data.note}` : ''}\n\n[키워드]\n${data.keywords.join(', ')}`
    navigator.clipboard.writeText(text)
    setCopiedFull(true)
    setTimeout(() => setCopiedFull(false), 2000)
  }

  // 차트 텍스트를 줄바꿈으로 분리
  const chartLines = data.chart.split('\\n').join('\n').split('\n')

  return (
    <div className="space-y-4">
      {/* STT 원문 */}
      {transcript && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 flex items-center gap-2 border-b border-blue-100">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">STT 원문</span>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      {/* Chart Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-medium text-white">Chart Note</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>

        {/* Chart Content */}
        <div className="p-4">
          <pre className="font-mono text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
            {chartLines.map((line, i) => {
              // r/o 라인 강조
              if (line.startsWith('r/o')) {
                return (
                  <div key={i} className="text-amber-600 font-medium">
                    {line}
                  </div>
                )
              }
              // P> 라인 강조
              if (line.startsWith('P>')) {
                return (
                  <div key={i} className="text-teal-600 font-semibold mt-2">
                    {line}
                  </div>
                )
              }
              // 치료 항목 (- 로 시작)
              if (line.startsWith('- ')) {
                return (
                  <div key={i} className="text-gray-700 pl-2">
                    {line}
                  </div>
                )
              }
              // 첫 줄 (부위 + 증상) 강조
              if (i === 0) {
                return (
                  <div key={i} className="text-lg font-bold text-gray-900 mb-1">
                    {line}
                  </div>
                )
              }
              return <div key={i}>{line}</div>
            })}
          </pre>

          {/* Note */}
          {data.note && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
              <p className="text-sm text-gray-500 italic">{data.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      {data.keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-teal-50 px-4 py-2.5 flex items-center gap-2 border-b border-teal-100">
            <Tag className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-800">추출 키워드</span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border border-teal-100"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 전체 복사 버튼 */}
      {transcript && (
        <div className="text-center">
          <button
            onClick={handleCopyFull}
            className="btn-secondary text-sm"
          >
            {copiedFull ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedFull ? '전체 복사됨' : '전체 복사 (원문 + 차트 + 키워드)'}
          </button>
        </div>
      )}
    </div>
  )
}
