import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 로컬 폴백 (DB 미연결 시)
const localAppointments: Record<string, unknown>[] = []

// GET: 예약 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')           // YYYY-MM-DD
  const status = searchParams.get('status')       // pending | confirmed | all
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  if (supabase) {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (date) {
        query = query.eq('appointment_date', date)
      }
      if (startDate && endDate) {
        query = query.gte('appointment_date', startDate).lte('appointment_date', endDate)
      }
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query.limit(100)

      if (error) {
        console.error('Appointments fetch error:', error)
        return NextResponse.json({ appointments: [], error: error.message })
      }

      return NextResponse.json({ appointments: data || [] })
    } catch (error) {
      console.error('Appointments error:', error)
      return NextResponse.json({ appointments: [], error: 'Server error' })
    }
  }

  // 로컬 폴백
  let filtered = localAppointments
  if (date) filtered = filtered.filter((a: Record<string, unknown>) => a.appointment_date === date)
  if (status && status !== 'all') filtered = filtered.filter((a: Record<string, unknown>) => a.status === status)
  return NextResponse.json({ appointments: filtered, source: 'local' })
}

// POST: 새 예약 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patient_name, patient_phone, appointment_date, appointment_time,
      duration_minutes, department, doctor_name, reason, status,
      source, call_transcript, ai_extracted, notes,
    } = body

    if (!patient_name || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: '환자명, 날짜, 시간은 필수입니다.' },
        { status: 400 }
      )
    }

    const record = {
      patient_name,
      patient_phone: patient_phone || null,
      appointment_date,
      appointment_time,
      duration_minutes: duration_minutes || 30,
      department: department || '정형외과',
      doctor_name: doctor_name || null,
      reason: reason || null,
      status: status || 'pending',
      source: source || 'call',
      call_transcript: call_transcript || null,
      ai_extracted: ai_extracted || {},
      notes: notes || null,
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert(record)
        .select()
        .single()

      if (error) {
        console.error('Appointment insert error:', error)
        return NextResponse.json({ error: '예약 저장 실패' }, { status: 500 })
      }
      return NextResponse.json({ appointment: data })
    }

    // 로컬 폴백
    const local = { ...record, id: `local_${Date.now()}`, created_at: new Date().toISOString() }
    localAppointments.push(local)
    return NextResponse.json({ appointment: local, source: 'local' })
  } catch (error) {
    console.error('Appointment create error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// PATCH: 예약 상태 변경 (확인/취소)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, confirmed_by, notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id와 status는 필수입니다.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'confirmed') {
      updates.confirmed_by = confirmed_by || null
      updates.confirmed_at = new Date().toISOString()
    }
    if (notes !== undefined) {
      updates.notes = notes
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Appointment update error:', error)
        return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
      }
      return NextResponse.json({ appointment: data })
    }

    // 로컬 폴백
    const idx = localAppointments.findIndex((a: Record<string, unknown>) => a.id === id)
    if (idx >= 0) {
      Object.assign(localAppointments[idx], updates)
      return NextResponse.json({ appointment: localAppointments[idx], source: 'local' })
    }
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
  } catch (error) {
    console.error('Appointment update error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
