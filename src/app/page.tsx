import Link from 'next/link'
import { Mic, FileText, Brain, Shield, ArrowRight, Check, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">Dr.Note</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dictionary" className="btn-ghost text-sm py-2 px-3">
              <BookOpen className="w-4 h-4" />
              용어 사전
            </Link>
            <Link href="/demo" className="btn-primary text-sm py-2 px-4">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>정형외과 전문 AI</span>
          </div>

          <h1 className="text-display text-gray-900 mb-6">
            진료 대화를
            <br />
            <span className="text-gradient">SOAP 차트로 자동 변환</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            환자와의 대화를 녹음하면 AI가 HNP, ORIF, ROM 등
            정형외과 전문 약어로 차트를 작성합니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo" className="btn-primary text-base px-8 py-4">
              <Mic className="w-5 h-5" />
              지금 바로 테스트
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Check className="w-4 h-4 text-teal-600" />
              <span>회원가입 없이 바로 사용</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="card-elevated p-8 md:p-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="ml-4 text-sm text-gray-400">AI 분석 결과</span>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* SOAP Notes */}
              <div className="lg:col-span-3 space-y-5">
                <SoapItem
                  label="S"
                  title="Subjective"
                  content="Lt. knee pain (+), 3주 전 trauma Hx, 계단 오르내릴 때 통증 악화"
                  variant="s"
                />
                <SoapItem
                  label="O"
                  title="Objective"
                  content="ROM limitation (-), Swelling (+), McMurray test (+)"
                  variant="o"
                />
                <SoapItem
                  label="A"
                  title="Assessment"
                  content="R/O Lt. knee meniscal tear"
                  variant="a"
                />
                <SoapItem
                  label="P"
                  title="Plan"
                  content="MRI Lt. knee 예약, NSAIDs 처방, F/U 2주"
                  variant="p"
                />
              </div>

              {/* Keywords */}
              <div className="lg:col-span-2">
                <div className="card-flat p-6 h-full">
                  <p className="text-sm font-medium text-gray-500 mb-4">추출된 의학 키워드</p>
                  <div className="flex flex-wrap gap-2">
                    {['Lt. knee', 'Meniscal tear', 'McMurray (+)', 'ROM', 'MRI', 'NSAIDs', 'Trauma Hx'].map((keyword) => (
                      <span key={keyword} className="badge-primary">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">이렇게 작동합니다</h2>
            <p className="text-gray-500 text-lg">3단계로 완성되는 AI 차트 요약</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              icon={<Mic className="w-6 h-6" />}
              title="진료 대화 녹음"
              description="브라우저에서 직접 녹음하거나 기존 음성 파일을 업로드합니다."
            />
            <StepCard
              number="02"
              icon={<FileText className="w-6 h-6" />}
              title="Whisper STT"
              description="OpenAI Whisper가 음성을 정확한 텍스트로 변환합니다."
            />
            <StepCard
              number="03"
              icon={<Brain className="w-6 h-6" />}
              title="GPT-4o 요약"
              description="정형외과 전문 프롬프트로 SOAP 노트를 자동 생성합니다."
            />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated p-8 flex gap-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h3 className="text-title text-gray-900 mb-2">의료 데이터 보안</h3>
              <p className="text-gray-500 leading-relaxed">
                모든 데이터는 Supabase RLS(Row Level Security)로 보호됩니다.
                사용자 본인만 자신의 진료 기록에 접근할 수 있으며,
                음성 파일과 차트 데이터는 암호화되어 안전하게 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-headline text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            회원가입 없이 무료로 테스트해볼 수 있습니다.
          </p>
          <Link href="/demo" className="btn-primary text-base px-8 py-4 inline-flex">
            <Mic className="w-5 h-5" />
            데모 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Dr.Note</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 Dr.Note. 정형외과 AI 차트 요약 서비스.
          </p>
        </div>
      </footer>
    </div>
  )
}

function SoapItem({
  label,
  title,
  content,
  variant,
}: {
  label: string
  title: string
  content: string
  variant: 's' | 'o' | 'a' | 'p'
}) {
  const colors = {
    s: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    o: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    a: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    p: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  }
  const c = colors[variant]

  return (
    <div className="flex gap-4">
      <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
        <span className={`text-sm font-bold ${c.text}`}>{label}</span>
      </div>
      <div className="flex-1 pt-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-gray-700 leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          {icon}
        </div>
        <span className="text-4xl font-bold text-gray-100">{number}</span>
      </div>
      <h3 className="text-title text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}
