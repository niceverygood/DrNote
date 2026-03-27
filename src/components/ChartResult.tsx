'use client'

import { useState } from 'react'
import { Copy, Check, FileText } from 'lucide-react'

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
  const [showTranscript, setShowTranscript] = useState(false)

  const handleCopy = () => {
    const text = `${data.chart}${data.note ? `\n-----\n${data.note}` : ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 차트 텍스트를 줄바꿈으로 분리
  const chartLines = data.chart.split('\\n').join('\n').split('\n')

  return (
    <div className="space-y-4">
      {/* Chart Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-slate-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-medium text-white">Chart Note</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>

        {/* Chart Content */}
        <div className="p-5">
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
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
              <p className="text-sm text-gray-500">{data.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      {data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((keyword, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-100"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Transcript Toggle */}
      {transcript && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            {showTranscript ? '원문 숨기기' : '원문 보기'}
          </button>
          {showTranscript && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
