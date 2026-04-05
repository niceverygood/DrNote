'use client'

import { useState } from 'react'
import { Check, Copy, FileDown, Mic, QrCode } from 'lucide-react'
import { toast } from 'sonner'

interface SessionCompletePanelProps {
  onCopyChart: () => void
  onCopyEMR: () => void
  onNextPatient: () => void
  patientEducation: { title: string; description: string } | null
}

export function SessionCompletePanel({
  onCopyChart,
  onCopyEMR,
  onNextPatient,
  patientEducation,
}: SessionCompletePanelProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const markDone = (step: string) => {
    setCompletedSteps(prev => new Set(prev).add(step))
  }

  const steps = [
    {
      id: 'emr',
      label: 'EMR 복사',
      desc: '차트+코드+처방 한번에',
      icon: FileDown,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      action: () => { onCopyEMR(); markDone('emr') },
    },
    {
      id: 'chart',
      label: '차트만 복사',
      desc: '차트 내용만',
      icon: Copy,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      action: () => { onCopyChart(); markDone('chart') },
    },
    {
      id: 'edu',
      label: '환자 안내',
      desc: patientEducation ? patientEducation.title : '교육자료 생성 후 가능',
      icon: QrCode,
      color: patientEducation ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-gray-400 bg-gray-50 border-gray-200',
      action: () => {
        if (!patientEducation) {
          toast.info('먼저 Dx에서 "환자 설명" 또는 "전체 분석"을 실행하세요')
          return
        }
        const text = `[${patientEducation.title}]\n${patientEducation.description}`
        navigator.clipboard.writeText(text)
        toast.success('환자 교육자료 복사됨')
        markDone('edu')
      },
    },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
        {steps.map((step) => {
          const Icon = step.icon
          const done = completedSteps.has(step.id)
          return (
            <button
              key={step.id}
              onClick={step.action}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                done
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : step.color
              } hover:scale-105 active:scale-95`}
              title={step.desc}
            >
              {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          )
        })}

        <div className="w-px h-8 bg-gray-200" />

        <button
          onClick={onNextPatient}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Mic className="w-4 h-4" />
          <span>다음 환자</span>
        </button>
      </div>
    </div>
  )
}
