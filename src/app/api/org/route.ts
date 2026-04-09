import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// 로컬 폴백
const localOrgs: Record<string, unknown>[] = []
const localMembers: Record<string, unknown>[] = []

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'DRN-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// GET: 병원 정보 + 직원 목록
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const inviteCode = searchParams.get('invite_code')

  // 초대코드로 병원 조회 (가입 시)
  if (inviteCode) {
    if (supabase) {
      const { data: member } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .single()
      if (member) {
        return NextResponse.json({ member, org: member.organizations })
      }
      return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 })
    }
    const member = localMembers.find(m => m.invite_code === inviteCode && m.status === 'pending')
    if (member) {
      const org = localOrgs.find(o => o.id === member.org_id)
      return NextResponse.json({ member, org })
    }
    return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 })
  }

  // 병원 정보 + 직원 목록
  if (orgId && supabase) {
    const [org, members] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('org_members').select('*').eq('org_id', orgId).order('created_at'),
    ])
    return NextResponse.json({ org: org.data, members: members.data || [] })
  }

  if (orgId) {
    return NextResponse.json({
      org: localOrgs.find(o => o.id === orgId),
      members: localMembers.filter(m => m.org_id === orgId),
      source: 'local',
    })
  }

  return NextResponse.json({ error: 'org_id 또는 invite_code 필요' }, { status: 400 })
}

// POST: 병원 생성 / 직원 초대 / 초대코드 가입
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // 병원 생성 (대표 최초 가입)
    if (action === 'create_org') {
      const { name, hospital_type, owner_user_id, owner_name } = body

      const orgRecord = {
        name,
        hospital_type: hospital_type || 'outpatient',
        owner_user_id: owner_user_id || 'demo_user',
        subscription_tier: 'dev', // 개발 중: 전체 기능 해제
        max_members: 999,
        max_charts_per_month: 999999,
      }

      if (supabase) {
        const { data: org, error } = await supabase.from('organizations').insert(orgRecord).select().single()
        if (error) throw error

        // 대표를 admin으로 자동 등록
        await supabase.from('org_members').insert({
          org_id: org.id,
          user_id: owner_user_id || 'demo_user',
          name: owner_name || '대표',
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString(),
        })

        return NextResponse.json({ org })
      }

      const local = { ...orgRecord, id: `org_${Date.now()}`, created_at: new Date().toISOString() }
      localOrgs.push(local)
      localMembers.push({
        id: `mem_${Date.now()}`, org_id: local.id,
        user_id: owner_user_id || 'demo_user', name: owner_name || '대표',
        role: 'admin', status: 'active', joined_at: new Date().toISOString(),
      })
      return NextResponse.json({ org: local, source: 'local' })
    }

    // 직원 초대 (초대 코드 생성)
    if (action === 'invite_member') {
      const { org_id, name, role, invited_by } = body
      const invite_code = generateInviteCode()

      const memberRecord = {
        org_id, name,
        role: role || 'doctor',
        invite_code,
        status: 'pending',
        invited_by: invited_by || null,
      }

      if (supabase) {
        const { data, error } = await supabase.from('org_members').insert(memberRecord).select().single()
        if (error) throw error
        return NextResponse.json({ member: data, invite_code })
      }

      const local = { ...memberRecord, id: `mem_${Date.now()}`, created_at: new Date().toISOString() }
      localMembers.push(local)
      return NextResponse.json({ member: local, invite_code, source: 'local' })
    }

    // 초대코드로 가입 (직원이 코드 입력)
    if (action === 'join_org') {
      const { invite_code, user_id } = body

      if (supabase) {
        // 코드 확인
        const { data: member, error: findErr } = await supabase
          .from('org_members')
          .select('*')
          .eq('invite_code', invite_code)
          .eq('status', 'pending')
          .single()

        if (findErr || !member) {
          return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 })
        }

        // 활성화
        const { data, error } = await supabase
          .from('org_members')
          .update({
            user_id: user_id || 'demo_user',
            status: 'active',
            joined_at: new Date().toISOString(),
            invite_code: null, // 코드 소멸
          })
          .eq('id', member.id)
          .select()
          .single()

        if (error) throw error

        // user_profiles에 org 연결
        await supabase
          .from('user_profiles')
          .update({ org_id: member.org_id, org_role: member.role })
          .eq('user_id', user_id || 'demo_user')

        return NextResponse.json({ member: data, org_id: member.org_id })
      }

      // 로컬 폴백
      const idx = localMembers.findIndex(m => m.invite_code === invite_code && m.status === 'pending')
      if (idx < 0) return NextResponse.json({ error: '유효하지 않은 초대 코드' }, { status: 404 })
      localMembers[idx] = { ...localMembers[idx], user_id: user_id || 'demo_user', status: 'active', invite_code: null }
      return NextResponse.json({ member: localMembers[idx], source: 'local' })
    }

    // 직원 비활성화
    if (action === 'disable_member') {
      const { member_id } = body
      if (supabase) {
        const { data, error } = await supabase
          .from('org_members')
          .update({ status: 'disabled' })
          .eq('id', member_id)
          .select().single()
        if (error) throw error
        return NextResponse.json({ member: data })
      }
    }

    return NextResponse.json({ error: '잘못된 action' }, { status: 400 })
  } catch (error) {
    console.error('Org error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
