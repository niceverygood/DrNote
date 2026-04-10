import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const localRecords: Record<string, unknown>[] = []
const localQuestionnaires: Record<string, unknown>[] = []

// GET: 환자 기록 / 문진표 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const type = searchParams.get('type') || 'records' // records | questionnaires

  if (!phone) return NextResponse.json({ error: '전화번호 필요' }, { status: 400 })

  if (supabase) {
    try {
      if (type === 'questionnaires') {
        const { data } = await supabase.from('questionnaires')
          .select('*').eq('patient_phone', phone).order('created_at', { ascending: false })
        return NextResponse.json({ questionnaires: data || [] })
      }
      const { data } = await supabase.from('patient_records')
        .select('*').eq('patient_phone', phone).eq('visible', true)
        .order('visit_date', { ascending: false })
      return NextResponse.json({ records: data || [] })
    } catch (error) {
      console.error('Patient fetch error:', error)
      return NextResponse.json({ records: [], error: 'Server error' })
    }
  }

  // 로컬 폴백
  if (type === 'questionnaires') {
    return NextResponse.json({
      questionnaires: localQuestionnaires.filter(q => q.patient_phone === phone),
      source: 'local',
    })
  }
  return NextResponse.json({
    records: localRecords.filter(r => r.patient_phone === phone),
    source: 'local',
  })
}

// POST: 문진표 제출
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'submit_questionnaire') {
      const record = {
        patient_phone: body.patient_phone,
        patient_name: body.patient_name || null,
        visit_date: body.visit_date || new Date().toISOString().split('T')[0],
        org_id: body.org_id || null,
        content: body.content || {},
        status: 'submitted',
      }

      if (supabase) {
        const { data, error } = await supabase.from('questionnaires').insert(record).select().single()
        if (error) throw error
        return NextResponse.json({ questionnaire: data })
      }
      const local = { ...record, id: `q_${Date.now()}`, created_at: new Date().toISOString() }
      localQuestionnaires.push(local)
      return NextResponse.json({ questionnaire: local, source: 'local' })
    }

    return NextResponse.json({ error: '잘못된 action' }, { status: 400 })
  } catch (error) {
    console.error('Patient error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
