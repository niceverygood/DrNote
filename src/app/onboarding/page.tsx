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
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [hospitalType, setHospitalType] = useState<HospitalType | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [hospitalName, setHospitalName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoinByCode = async () => {
    if (!inviteCode) return
    setLoading(true)
    try {
      const res = await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_org', invite_code: inviteCode }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); setLoading(false); return }

      // 초대된 역할로 프로필 저장
      const member = data.member
      const orgRes = await fetch(`/api/org?org_id=${data.org_id || member.org_id}`)
      const orgData = await orgRes.json()

      localStorage.setItem('drnote-profile', JSON.stringify({
        role: member.role,
        hospital_type: orgData.org?.hospital_type || 'outpatient',
        hospital_name: orgData.org?.name || '',
        org_id: member.org_id,
        onboarding_complete: true,
      }))
      toast.success(`${orgData.org?.name || '병원'}에 가입되었습니다!`)
      router.push('/dashboard')
    } catch { toast.error('가입에 실패했습니다') }
    finally { setLoading(false) }
  }

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
          {/* Mode Select: 신규 or 초대코드 */}
          {mode === 'select' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">시작하기</h2>
              <p className="text-sm text-gray-500 mb-6 text-center">병원을 등록하거나, 초대 코드로 가입하세요</p>

              <div className="space-y-3">
                <button onClick={() => { setMode('create'); setStep(1) }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">병원 대표로 시작</span>
                    <p className="text-sm text-gray-500">새 병원을 등록하고 직원을 초대합니다</p>
                  </div>
                </button>

                <button onClick={() => setMode('join')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">초대 코드로 가입</span>
                    <p className="text-sm text-gray-500">대표에게 받은 코드를 입력합니다</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Join by Code */}
          {mode === 'join' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">초대 코드 입력</h2>
              <p className="text-sm text-gray-500 mb-6">병원 대표에게 받은 초대 코드를 입력하세요</p>

              <input
                type="text"
                placeholder="예: DRN-A3F2"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 text-center text-xl font-mono font-bold tracking-widest border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={8}
              />

              <div className="flex gap-3 mt-6">
                <button onClick={() => setMode('select')}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                  이전
                </button>
                <button onClick={handleJoinByCode} disabled={loading || inviteCode.length < 5}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  가입하기
                </button>
              </div>
            </>
          )}

          {/* Step 1: 병원 유형 (create mode) */}
          {mode === 'create' && step === 1 && (
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
          {mode === 'create' && step === 2 && (
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
          {mode === 'create' && step === 3 && (
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
