'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Users, Stethoscope, Heart, UserCheck,
  Copy, Check, Trash2, Building2, Shield, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface OrgMember {
  id: string
  name: string
  role: string
  status: string
  invite_code: string | null
  joined_at: string | null
  created_at: string
}

interface Organization {
  id: string
  name: string
  hospital_type: string
  subscription_tier: string
  max_members: number
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Stethoscope; color: string }> = {
  admin: { label: '관리자', icon: Shield, color: 'bg-indigo-100 text-indigo-700' },
  doctor: { label: '의사', icon: Stethoscope, color: 'bg-teal-100 text-teal-700' },
  nurse: { label: '간호사', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  counselor: { label: '상담사', icon: Users, color: 'bg-purple-100 text-purple-700' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-green-100 text-green-700' },
  pending: { label: '초대 대기', color: 'bg-amber-100 text-amber-700' },
  disabled: { label: '비활성', color: 'bg-gray-100 text-gray-500' },
}

export default function AdminPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('doctor')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [loading, setLoading] = useState(false)

  // 병원 없으면 생성
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('outpatient')

  // 프로필에서 org_id 가져오기
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('drnote-profile')
    if (saved) {
      const profile = JSON.parse(saved)
      if (profile.org_id) {
        setOrgId(profile.org_id)
      } else {
        setShowCreateOrg(true)
      }
    } else {
      setShowCreateOrg(true)
    }
  }, [])

  // 데이터 로드
  const fetchOrg = useCallback(async () => {
    if (!orgId) return
    try {
      const res = await fetch(`/api/org?org_id=${orgId}`)
      const data = await res.json()
      if (data.org) setOrg(data.org)
      if (data.members) setMembers(data.members)
    } catch (error) { console.error('Fetch org error:', error) }
  }, [orgId])

  useEffect(() => { if (orgId) fetchOrg() }, [orgId, fetchOrg])

  // 병원 생성
  const handleCreateOrg = async () => {
    if (!orgName) { toast.error('병원명을 입력하세요'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_org',
          name: orgName,
          hospital_type: orgType,
        }),
      })
      const data = await res.json()
      if (data.org) {
        setOrgId(data.org.id)
        setShowCreateOrg(false)
        // localStorage에 org_id 저장
        const profile = JSON.parse(localStorage.getItem('drnote-profile') || '{}')
        profile.org_id = data.org.id
        profile.hospital_name = orgName
        localStorage.setItem('drnote-profile', JSON.stringify(profile))
        toast.success('병원 등록 완료')
      }
    } catch { toast.error('등록 실패') }
    finally { setLoading(false) }
  }

  // 직원 초대
  const handleInvite = async () => {
    if (!inviteName || !orgId) { toast.error('이름을 입력하세요'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite_member',
          org_id: orgId,
          name: inviteName,
          role: inviteRole,
        }),
      })
      const data = await res.json()
      if (data.invite_code) {
        setGeneratedCode(data.invite_code)
        toast.success('초대 코드가 생성되었습니다')
        fetchOrg()
      }
    } catch { toast.error('초대 실패') }
    finally { setLoading(false) }
  }

  // 직원 비활성화
  const handleDisable = async (memberId: string, name: string) => {
    if (!confirm(`${name} 직원을 비활성화하시겠습니까?`)) return
    try {
      await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_member', member_id: memberId }),
      })
      toast.success('비활성화 완료')
      fetchOrg()
    } catch { toast.error('실패') }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast.success('초대 코드 복사됨')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // 병원 생성 모달
  if (showCreateOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            병원 등록
          </h2>
          <p className="text-sm text-gray-500 mb-6">대표 계정으로 병원을 등록하세요</p>

          <div className="space-y-4">
            <input placeholder="병원명 *" value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={orgType} onChange={e => setOrgType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="outpatient">외래 전문</option>
              <option value="inpatient">입원 병원</option>
              <option value="both">복합 (외래+입원)</option>
            </select>
          </div>

          <button onClick={handleCreateOrg} disabled={loading || !orgName}
            className="w-full mt-6 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            병원 등록하기
          </button>

          <Link href="/dashboard" className="block text-center mt-4 text-sm text-gray-400 hover:text-gray-600">
            나중에 하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-semibold text-gray-900">병원 관리</h1>
            </div>
          </div>
          <button onClick={() => { setShowInvite(true); setGeneratedCode(null); setInviteName('') }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> 직원 초대
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* 병원 정보 */}
        {org && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{org.name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{{ outpatient: '외래 전문', inpatient: '입원 병원', both: '복합' }[org.hospital_type]}</span>
                  <span>·</span>
                  <span>{members.filter(m => m.status === 'active').length}명 활성</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 직원 목록 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">직원 목록 ({members.length}명)</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {members.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>아직 등록된 직원이 없습니다</p>
                <p className="text-sm mt-1">위 [직원 초대] 버튼으로 추가하세요</p>
              </div>
            )}
            {members.map(member => {
              const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.doctor
              const sc = STATUS_CONFIG[member.status] || STATUS_CONFIG.pending
              const Icon = rc.icon
              return (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rc.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{member.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${rc.color}`}>{rc.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sc.color}`}>{sc.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {member.status === 'pending' && member.invite_code && (
                          <button onClick={() => copyCode(member.invite_code!)}
                            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700">
                            <Copy className="w-3 h-3" /> 초대 코드: {member.invite_code}
                          </button>
                        )}
                        {member.joined_at && `가입: ${new Date(member.joined_at).toLocaleDateString('ko-KR')}`}
                      </div>
                    </div>
                  </div>
                  {member.role !== 'admin' && member.status !== 'disabled' && (
                    <button onClick={() => handleDisable(member.id, member.name)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* 초대 모달 */}
      {showInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {!generatedCode ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" /> 직원 초대
                </h3>
                <div className="space-y-3">
                  <input placeholder="직원 이름 *" value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="doctor">의사</option>
                    <option value="nurse">간호사</option>
                    <option value="counselor">상담사</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                <button onClick={handleInvite} disabled={loading || !inviteName}
                  className="w-full mt-5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  초대 코드 생성
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">초대 코드 생성 완료</h3>
                <p className="text-sm text-gray-500 text-center mb-6">직원에게 이 코드를 전달하세요</p>

                <div className="bg-gray-50 rounded-xl p-6 text-center mb-4">
                  <p className="text-3xl font-mono font-bold text-indigo-600 tracking-wider">{generatedCode}</p>
                </div>

                <button onClick={() => copyCode(generatedCode)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? '복사됨!' : '코드 복사'}
                </button>

                <button onClick={() => setShowInvite(false)}
                  className="w-full mt-2 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
