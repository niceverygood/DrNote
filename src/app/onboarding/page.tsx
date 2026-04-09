'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Bed, Building, Stethoscope, Heart, Users,
  ArrowRight, Check, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

type HospitalType = 'outpatient' | 'inpatient' | 'both'
type Role = 'doctor' | 'nurse' | 'counselor'

const HOSPITAL_TYPES: { value: HospitalType; label: string; desc: string; icon: typeof Building2 }[] = [
  { value: 'outpatient', label: '외래 전문', desc: '의원급 · 외래 진료 중심', icon: Building2 },
  { value: 'inpatient', label: '입원 병원', desc: '병원급 · 입원/수술 중심', icon: Bed },
  { value: 'both', label: '복합 (외래+입원)', desc: '외래 진료 + 입원 병동', icon: Building },
]

const ROLES: { value: Role; label: string; desc: string; icon: typeof Stethoscope }[] = [
  { value: 'doctor', label: '의사', desc: '진료 기록 · 차트 작성', icon: Stethoscope },
  { value: 'nurse', label: '간호사', desc: '예약 관리 · 병동 관리', icon: Heart },
  { value: 'counselor', label: '상담사', desc: '환자 안내 · 실시간 수신', icon: Users },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [hospitalType, setHospitalType] = useState<HospitalType | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [hospitalName, setHospitalName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    if (!hospitalType || !role) return
    setLoading(true)

    try {
      // 프로필 저장 (Supabase 연결 시)
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user', // Supabase auth 연결 시 실제 user_id
          role,
          hospital_type: hospitalType,
          hospital_name: hospitalName,
        }),
      })

      // localStorage에도 저장 (빠른 접근용)
      localStorage.setItem('drnote-profile', JSON.stringify({
        role,
        hospital_type: hospitalType,
        hospital_name: hospitalName,
        onboarding_complete: true,
      }))

      toast.success('설정 완료!')
      router.push('/dashboard')
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${
              s <= step ? 'bg-teal-500 w-12' : 'bg-gray-200 w-8'
            }`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Step 1: 병원 유형 */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">병원 유형을 선택하세요</h2>
              <p className="text-sm text-gray-500 mb-6">유형에 따라 메뉴가 최적화됩니다</p>

              <div className="space-y-3">
                {HOSPITAL_TYPES.map(type => {
                  const Icon = type.icon
                  const selected = hospitalType === type.value
                  return (
                    <button key={type.value} onClick={() => setHospitalType(type.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selected ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{type.label}</span>
                        <p className="text-sm text-gray-500">{type.desc}</p>
                      </div>
                      {selected && <Check className="w-5 h-5 text-teal-600" />}
                    </button>
                  )
                })}
              </div>

              <button onClick={() => hospitalType && setStep(2)} disabled={!hospitalType}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
                다음 <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Step 2: 역할 */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">역할을 선택하세요</h2>
              <p className="text-sm text-gray-500 mb-6">역할에 따라 보이는 메뉴가 달라집니다</p>

              <div className="space-y-3">
                {ROLES.map(r => {
                  const Icon = r.icon
                  const selected = role === r.value
                  return (
                    <button key={r.value} onClick={() => setRole(r.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selected ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{r.label}</span>
                        <p className="text-sm text-gray-500">{r.desc}</p>
                      </div>
                      {selected && <Check className="w-5 h-5 text-teal-600" />}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                  이전
                </button>
                <button onClick={() => role && setStep(3)} disabled={!role}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
                  다음 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Step 3: 병원명 + 완료 */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">거의 다 됐습니다!</h2>
              <p className="text-sm text-gray-500 mb-6">병원명을 입력하세요 (선택)</p>

              <input
                type="text"
                placeholder="예: OO정형외과의원"
                value={hospitalName}
                onChange={e => setHospitalName(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mb-6"
              />

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-500 mb-3">설정 확인</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">병원 유형</span>
                    <span className="font-medium text-gray-900">{HOSPITAL_TYPES.find(h => h.value === hospitalType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">역할</span>
                    <span className="font-medium text-gray-900">{ROLES.find(r => r.value === role)?.label}</span>
                  </div>
                  {hospitalName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">병원명</span>
                      <span className="font-medium text-gray-900">{hospitalName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                  이전
                </button>
                <button onClick={handleComplete} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  시작하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
