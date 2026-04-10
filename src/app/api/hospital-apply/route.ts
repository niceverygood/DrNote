import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const localApps: Record<string, unknown>[] = []

// GET: 가입 신청 목록 (관리자용)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'

  if (supabase) {
    const { data } = await supabase.from('hospital_applications')
      .select('*').eq('status', status).order('created_at', { ascending: false })
    return NextResponse.json({ applications: data || [] })
  }
  return NextResponse.json({
    applications: localApps.filter(a => a.status === status),
    source: 'local',
  })
}

// POST: 가입 신청 / 승인 / 거절
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // 병원 가입 신청
    if (action === 'apply') {
      const record = {
        applicant_name: body.applicant_name,
        hospital_name: body.hospital_name,
        hospital_type: body.hospital_type || 'outpatient',
        phone: body.phone || null,
        email: body.email || null,
        license_info: body.license_info || null,
        document_url: body.document_url || null,
        status: 'pending',
      }

      if (supabase) {
        const { data, error } = await supabase.from('hospital_applications').insert(record).select().single()
        if (error) throw error
        return NextResponse.json({ application: data })
      }
      const local = { ...record, id: `app_${Date.now()}`, created_at: new Date().toISOString() }
      localApps.push(local)
      return NextResponse.json({ application: local, source: 'local' })
    }

    // 승인
    if (action === 'approve') {
      if (supabase) {
        const { data, error } = await supabase.from('hospital_applications')
          .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: body.reviewed_by || 'admin' })
          .eq('id', body.id).select().single()
        if (error) throw error
        return NextResponse.json({ application: data })
      }
    }

    // 거절
    if (action === 'reject') {
      if (supabase) {
        const { data, error } = await supabase.from('hospital_applications')
          .update({ status: 'rejected', reject_reason: body.reason || '', reviewed_at: new Date().toISOString() })
          .eq('id', body.id).select().single()
        if (error) throw error
        return NextResponse.json({ application: data })
      }
    }

    return NextResponse.json({ error: '잘못된 action' }, { status: 400 })
  } catch (error) {
    console.error('Hospital apply error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
