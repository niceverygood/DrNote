'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mic, Bed, Calendar, Users, Scan, BookOpen, Settings, Shield,
  Stethoscope, Heart, FileText, ArrowRight, LogOut,
} from 'lucide-react'

interface UserProfile {
  role: 'doctor' | 'nurse' | 'counselor'
  hospital_type: 'outpatient' | 'inpatient' | 'both'
  hospital_name: string
  onboarding_complete: boolean
}

interface MenuItem {
  href: string
  label: string
  desc: string
  icon: typeof Mic
  color: string
  roles: string[]              // 이 역할에 보임
  hospitalTypes: string[]      // 이 병원 유형에 보임
}

const MENU_ITEMS: MenuItem[] = [
  {
    href: '/demo', label: '외래 진료', desc: '녹음 → AI 차트 → EMR 복사',
    icon: Mic, color: 'bg-teal-50 text-teal-600 border-teal-200',
    roles: ['doctor'], hospitalTypes: ['outpatient', 'both'],
  },
  {
    href: '/inpatient', label: '병동 관리', desc: '입원 환자 · 회진 · 수술 기록',
    icon: Bed, color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    roles: ['doctor', 'nurse'], hospitalTypes: ['inpatient', 'both'],
  },
  {
    href: '/calendar', label: '예약 관리', desc: '통화 녹음 → 자동 예약 등록',
    icon: Calendar, color: 'bg-amber-50 text-amber-600 border-amber-200',
    roles: ['doctor', 'nurse', 'counselor'], hospitalTypes: ['outpatient', 'inpatient', 'both'],
  },
  {
    href: '/counselor', label: '상담사 뷰', desc: '실시간 차트 · 보험코드 수신',
    icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200',
    roles: ['counselor', 'nurse'], hospitalTypes: ['outpatient', 'inpatient', 'both'],
  },
  {
    href: '/imaging', label: '영상 분석', desc: 'X-ray AI 분석 · DICOM 뷰어',
    icon: Scan, color: 'bg-rose-50 text-rose-600 border-rose-200',
    roles: ['doctor'], hospitalTypes: ['outpatient', 'inpatient', 'both'],
  },
  {
    href: '/dictionary', label: '의학 용어 사전', desc: '정형외과 약어 검색',
    icon: BookOpen, color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    roles: ['doctor', 'nurse', 'counselor'], hospitalTypes: ['outpatient', 'inpatient', 'both'],
  },
]

const ROLE_CONFIG = {
  doctor: { label: '의사', icon: Stethoscope, color: 'text-teal-600' },
  nurse: { label: '간호사', icon: Heart, color: 'text-pink-600' },
  counselor: { label: '상담사', icon: Users, color: 'text-purple-600' },
}

const HOSPITAL_TYPE_LABELS = {
  outpatient: '외래 전문',
  inpatient: '입원 병원',
  both: '복합 (외래+입원)',
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem('drnote-profile')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.onboarding_complete) return parsed
      }
    } catch { /* ignore */ }
    return null
  })

  useEffect(() => {
    if (!profile) router.push('/onboarding')
  }, [profile, router])

  if (!profile) return null

  const roleConfig = ROLE_CONFIG[profile.role]
  const RoleIcon = roleConfig.icon

  // 역할 + 병원 유형에 따라 메뉴 필터
  const visibleMenus = MENU_ITEMS.filter(item =>
    item.roles.includes(profile.role) &&
    item.hospitalTypes.includes(profile.hospital_type)
  )

  const handleLogout = () => {
    localStorage.removeItem('drnote-profile')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Dr.Note</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RoleIcon className={`w-4 h-4 ${roleConfig.color}`} />
              <span>{roleConfig.label}</span>
              <span className="text-gray-300">·</span>
              <span>{profile.hospital_name || HOSPITAL_TYPE_LABELS[profile.hospital_type]}</span>
            </div>
            <button onClick={() => router.push('/admin')}
              className="btn-ghost text-sm py-1.5 px-2.5" title="병원 관리">
              <Shield className="w-4 h-4" />
            </button>
            <button onClick={() => router.push('/onboarding')}
              className="btn-ghost text-sm py-1.5 px-2.5" title="설정 변경">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={handleLogout}
              className="btn-ghost text-sm py-1.5 px-2.5 text-gray-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요{profile.role === 'doctor' ? ' 선생님' : ''}
          </h1>
          <p className="text-gray-500 mt-1">오늘도 Dr.Note와 함께 시작하세요</p>
        </div>

        {/* Menu Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMenus.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className={`group flex items-start gap-4 p-5 rounded-2xl border-2 transition-all hover:shadow-md hover:scale-[1.02] ${item.color}`}>
                <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Info */}
        <div className="mt-10 p-4 bg-white rounded-xl border border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            설정을 변경하려면 우측 상단 <Settings className="w-3 h-3 inline" /> 아이콘을 클릭하세요
          </p>
        </div>
      </main>
    </div>
  )
}
