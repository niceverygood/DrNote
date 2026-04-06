import Link from 'next/link'
import {
  Mic,
  FileText,
  Brain,
  Shield,
  ArrowRight,
  Check,
  BookOpen,
  ClipboardList,
  Pill,
  Globe,
  Users,
  Clock,
  Star,
  Scan,
  Smartphone,
  Download,
  Monitor,
} from 'lucide-react'

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
            <Link href="/counselor" className="btn-ghost text-sm py-2 px-3">
              <Users className="w-4 h-4" />
              상담사
            </Link>
            <Link href="/dictionary" className="btn-ghost text-sm py-2 px-3">
              <BookOpen className="w-4 h-4" />
              용어 사전
            </Link>
            <Link href="/demo" className="btn-primary text-sm py-2 px-4">
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>정형외과 전문 AI · Claude Opus 4.6</span>
          </div>

          <h1 className="text-display text-gray-900 mb-6">
            녹음 한 번이면
            <br />
            <span className="text-gradient">차트 + 보험코드 + 처방까지</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            환자와 대화하는 동안 AI가 실시간으로 음성을 인식하고,
            <br className="hidden sm:block" />
            CC/PI/Dx/Plan 차트 + KCD/EDI 코드 + 처방전을 자동 완성합니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/demo" className="btn-primary text-base px-8 py-4">
              <Mic className="w-5 h-5" />
              의사용 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/counselor" className="btn-secondary text-base px-8 py-4">
              <Users className="w-5 h-5" />
              상담사/간호사용
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-600" /> 회원가입 없이 즉시 사용</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-600" /> 모바일 앱처럼 설치 가능</span>
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-red-100 bg-red-50/30 p-8">
              <p className="text-sm font-bold text-red-400 uppercase tracking-wide mb-4">Before</p>
              <div className="space-y-3 text-sm text-gray-600">
                <p>차트 수기 작성 <span className="text-red-500 font-semibold">5분</span></p>
                <p>KCD 코드 검색 <span className="text-red-500 font-semibold">2분</span></p>
                <p>EDI 코드 검색 <span className="text-red-500 font-semibold">2분</span></p>
                <p>처방 입력 <span className="text-red-500 font-semibold">3분</span></p>
                <p>상담사 전달 <span className="text-red-500 font-semibold">1분</span></p>
              </div>
              <div className="mt-6 pt-4 border-t border-red-200">
                <p className="text-2xl font-bold text-red-500">환자 1명당 13분</p>
                <p className="text-xs text-red-400 mt-1">하루 30명 = 6시간 30분</p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/30 p-8">
              <p className="text-sm font-bold text-teal-500 uppercase tracking-wide mb-4">After Dr.Note</p>
              <div className="space-y-3 text-sm text-gray-600">
                <p>환자 선택 (자동완성) <span className="text-teal-600 font-semibold">2초</span></p>
                <p>녹음 (진료 중 자동) <span className="text-teal-600 font-semibold">—</span></p>
                <p>AI 차트+코드+처방 <span className="text-teal-600 font-semibold">10초</span></p>
                <p>EMR 복사 <span className="text-teal-600 font-semibold">1초</span></p>
                <p>상담사 자동 수신 <span className="text-teal-600 font-semibold">0초</span></p>
              </div>
              <div className="mt-6 pt-4 border-t border-teal-200">
                <p className="text-2xl font-bold text-teal-600">환자 1명당 13초</p>
                <p className="text-xs text-teal-500 mt-1">차트 업무 시간 <span className="font-bold">98% 절감</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">의사의 진료 흐름</h2>
            <p className="text-gray-500 text-lg">녹음 한 번으로 모든 것이 자동 완성됩니다</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <StepCard number="01" icon={<Mic className="w-6 h-6" />}
              title="환자 선택 + 녹음"
              description="환자명 2글자 입력 → 자동완성. 녹음 시작하면 실시간 자막 표시." />
            <StepCard number="02" icon={<Brain className="w-6 h-6" />}
              title="AI 차트 생성"
              description="Claude AI가 CC/PI/Dx/Plan 차트를 10초 안에 자동 생성." />
            <StepCard number="03" icon={<ClipboardList className="w-6 h-6" />}
              title="코드 + 처방 추천"
              description="KCD 상병코드, EDI 수가코드, 약물 처방을 자동 추천." />
            <StepCard number="04" icon={<FileText className="w-6 h-6" />}
              title="EMR 복사"
              description="차트+코드+처방 한번에 복사. 다음 환자 클릭." />
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">핵심 기능</h2>
            <p className="text-gray-500 text-lg">매일 반복하는 업무를 AI가 대신합니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Mic className="w-5 h-5" />}
              iconBg="bg-blue-50 text-blue-600"
              title="실시간 음성 인식"
              description="녹음 중 실시간으로 자막이 표시됩니다. 별도 STT 서버 없이 브라우저에서 바로 인식."
            />
            <FeatureCard
              icon={<Brain className="w-5 h-5" />}
              iconBg="bg-purple-50 text-purple-600"
              title="AI 차트 자동 생성"
              description="정형외과 전문 약어(HNP, ROM, LE, RCS 등) 자동 적용. CC/PI/Dx/Plan 포맷 커스터마이징."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              iconBg="bg-indigo-50 text-indigo-600"
              title="보험코드 자동 추천"
              description="진단에서 KCD 45개, 치료계획에서 EDI 35개 코드 자동 매칭. 원클릭 복사."
            />
            <FeatureCard
              icon={<Pill className="w-5 h-5" />}
              iconBg="bg-rose-50 text-rose-600"
              title="스마트 처방 추천"
              description="13개 질환 처방 세트 자동 추천. 나만의 즐겨찾기 처방 저장."
            />
            <FeatureCard
              icon={<Clock className="w-5 h-5" />}
              iconBg="bg-cyan-50 text-cyan-600"
              title="환자 타임라인"
              description="방문별 호전/악화 자동 감지. AI 경과 요약으로 소견서 대응."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-amber-50 text-amber-600"
              title="상담사 실시간 연동"
              description="차트 생성 즉시 상담사 화면에 자동 전달. 보험코드, 처방 포함."
            />
            <FeatureCard
              icon={<Globe className="w-5 h-5" />}
              iconBg="bg-green-50 text-green-600"
              title="4개국어 번역"
              description="영어, 중국어, 베트남어, 일본어 자동 번역. 외국인 환자 응대."
            />
            <FeatureCard
              icon={<Scan className="w-5 h-5" />}
              iconBg="bg-violet-50 text-violet-600"
              title="AI 영상 분석"
              description="X-ray 영상 AI 분석 (골연령, 척추, 무릎). PACS DICOM 뷰어."
            />
            <FeatureCard
              icon={<Star className="w-5 h-5" />}
              iconBg="bg-yellow-50 text-yellow-600"
              title="자동 재진 감지"
              description="환자 선택 시 재진 자동 전환. 이전 기록을 AI가 참조하여 맥락 있는 차트."
            />
          </div>
        </div>
      </section>

      {/* Role-based Guide */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">역할별 사용 가이드</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 의사용 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-teal-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  의사용
                </h3>
                <p className="text-teal-100 text-sm mt-1">진료 기록 자동화</p>
              </div>
              <div className="p-6 space-y-4">
                <GuideStep step="1" text="환자 이름 입력 (자동완성 → 재진 자동 전환)" />
                <GuideStep step="2" text="[녹음 시작] → 환자와 대화 (실시간 자막)" />
                <GuideStep step="3" text="[녹음 완료] → AI 차트 자동 생성 (10초)" />
                <GuideStep step="4" text="보험코드 + 처방 자동 추천 확인" />
                <GuideStep step="5" text="[EMR 복사] → 붙여넣기 → [다음 환자]" />
                <div className="pt-4">
                  <Link href="/demo" className="btn-primary w-full justify-center py-3">
                    <Mic className="w-4 h-4" />
                    의사용 시작하기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 상담사/간호사용 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  상담사 / 간호사용
                </h3>
                <p className="text-indigo-100 text-sm mt-1">실시간 진료 정보 수신</p>
              </div>
              <div className="p-6 space-y-4">
                <GuideStep step="1" text="/counselor 페이지 열어두기" />
                <GuideStep step="2" text="의사가 차트 생성하면 자동 알림" />
                <GuideStep step="3" text="차트 + 상담 안내 사항 확인" />
                <GuideStep step="4" text="보험코드 + 처방 확인 → 환자 안내" />
                <GuideStep step="5" text="별도 전달 불필요, 모두 자동" />
                <div className="pt-4">
                  <Link href="/counselor" className="w-full justify-center py-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
                    <Users className="w-4 h-4" />
                    상담사용 시작하기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install Guide */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-headline text-gray-900 mb-4">앱처럼 설치하기</h2>
            <p className="text-gray-500 text-lg">앱스토어 다운로드 없이 홈 화면에 바로 추가</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3">iPhone / iPad</h3>
              <div className="text-sm text-gray-500 text-left space-y-2">
                <p><span className="font-semibold text-gray-700">1.</span> Safari로 접속</p>
                <p><span className="font-semibold text-gray-700">2.</span> 하단 공유 버튼 (□↑) 탭</p>
                <p><span className="font-semibold text-gray-700">3.</span> &quot;홈 화면에 추가&quot; 선택</p>
                <p><span className="font-semibold text-gray-700">4.</span> &quot;추가&quot; 탭 → 완료!</p>
              </div>
            </div>

            <div className="text-center p-8 rounded-2xl border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Download className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3">Android</h3>
              <div className="text-sm text-gray-500 text-left space-y-2">
                <p><span className="font-semibold text-gray-700">1.</span> Chrome으로 접속</p>
                <p><span className="font-semibold text-gray-700">2.</span> 메뉴(⋮) 탭</p>
                <p><span className="font-semibold text-gray-700">3.</span> &quot;앱 설치&quot; 또는 &quot;홈 화면에 추가&quot;</p>
                <p><span className="font-semibold text-gray-700">4.</span> &quot;설치&quot; 탭 → 완료!</p>
              </div>
            </div>

            <div className="text-center p-8 rounded-2xl border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3">PC (Chrome / Edge)</h3>
              <div className="text-sm text-gray-500 text-left space-y-2">
                <p><span className="font-semibold text-gray-700">1.</span> 브라우저로 접속</p>
                <p><span className="font-semibold text-gray-700">2.</span> 주소창 오른쪽 설치(⊕) 클릭</p>
                <p><span className="font-semibold text-gray-700">3.</span> &quot;설치&quot; 클릭</p>
                <p><span className="font-semibold text-gray-700">4.</span> 바탕화면에 앱 생성!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated p-8 flex gap-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h3 className="text-title text-gray-900 mb-2">의료 데이터 보안</h3>
              <p className="text-gray-500 leading-relaxed">
                모든 데이터는 TLS 암호화 전송, Row Level Security(RLS) 보호.
                API 키는 서버에서만 처리되며, 음성 인식은 브라우저 내에서 처리되어 외부로 전송되지 않습니다.
                모든 데이터의 소유권은 병원에 있습니다.
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
            녹음 한 번이면 차트 + 보험코드 + 처방까지.
            <br />
            의사의 시간을 환자에게 돌려드립니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo" className="btn-primary text-base px-8 py-4 inline-flex">
              <Mic className="w-5 h-5" />
              의사용 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/counselor" className="inline-flex items-center gap-2 text-base px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
              <Users className="w-5 h-5" />
              상담사용 시작하기
            </Link>
          </div>
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
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/demo" className="hover:text-gray-700">의사용</Link>
            <Link href="/counselor" className="hover:text-gray-700">상담사용</Link>
            <Link href="/imaging" className="hover:text-gray-700">영상분석</Link>
            <Link href="/dictionary" className="hover:text-gray-700">용어사전</Link>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 Dr.Note. 정형외과 AI 진료 보조.
          </p>
        </div>
      </footer>
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
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          {icon}
        </div>
        <span className="text-3xl font-bold text-gray-100">{number}</span>
      </div>
      <h3 className="text-title text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

function GuideStep({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-bold text-gray-500">{step}</span>
      </div>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  )
}
