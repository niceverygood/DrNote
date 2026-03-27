'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClinicalReport } from '@/components/ClinicalReport'

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-gray-900">Clinical Report Preview</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <ClinicalReport />
      </main>
    </div>
  )
}
