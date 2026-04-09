import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callClaudeJSON } from '@/lib/openai/claude-helper'
import { INPATIENT_PROMPTS } from '@/lib/inpatient-prompts'
import type { InpatientNoteType } from '@/lib/inpatient-prompts'

export const runtime = 'nodejs'
export const maxDuration = 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// 로컬 폴백
const localInpatients: Record<string, unknown>[] = []
const localNotes: Record<string, unknown>[] = []

// GET: 입원 환자 목록 또는 특정 환자의 기록
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patient_id')
  const status = searchParams.get('status') || 'admitted'

  if (supabase) {
    try {
      if (patientId) {
        // 특정 환자의 모든 기록
        const [patient, notes] = await Promise.all([
          supabase.from('inpatients').select('*').eq('id', patientId).single(),
          supabase.from('inpatient_notes').select('*').eq('inpatient_id', patientId).order('note_date', { ascending: false }),
        ])
        return NextResponse.json({
          patient: patient.data,
          notes: notes.data || [],
        })
      }
      // 전체 환자 목록
      const { data, error } = await supabase
        .from('inpatients')
        .select('*')
        .eq('status', status)
        .order('room_number')
      if (error) throw error
      return NextResponse.json({ patients: data || [] })
    } catch (error) {
      console.error('Inpatient fetch error:', error)
      return NextResponse.json({ patients: [], error: 'Server error' })
    }
  }

  // 로컬 폴백
  if (patientId) {
    return NextResponse.json({
      patient: localInpatients.find(p => p.id === patientId),
      notes: localNotes.filter(n => n.inpatient_id === patientId),
    })
  }
  return NextResponse.json({
    patients: localInpatients.filter(p => p.status === status),
    source: 'local',
  })
}

// POST: 환자 입원 등록 또는 기록 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // 환자 입원 등록
    if (action === 'admit') {
      const record = {
        patient_name: body.patient_name,
        patient_age: body.patient_age || null,
        patient_gender: body.patient_gender || null,
        room_number: body.room_number || null,
        bed_number: body.bed_number || null,
        admission_date: body.admission_date || new Date().toISOString().split('T')[0],
        attending_doctor: body.attending_doctor || null,
        admission_diagnosis: body.admission_diagnosis || null,
        status: 'admitted',
      }

      if (supabase) {
        const { data, error } = await supabase.from('inpatients').insert(record).select().single()
        if (error) throw error
        return NextResponse.json({ patient: data })
      }
      const local = { ...record, id: `local_${Date.now()}`, created_at: new Date().toISOString() }
      localInpatients.push(local)
      return NextResponse.json({ patient: local, source: 'local' })
    }

    // AI 기록 생성
    if (action === 'generate_note') {
      const { inpatient_id, note_type, transcript, context } = body
      const validType = note_type as InpatientNoteType
      const prompt = INPATIENT_PROMPTS[validType]
      if (!prompt) {
        return NextResponse.json({ error: '잘못된 기록 유형' }, { status: 400 })
      }

      let userPrompt = `다음 내용을 분석해서 기록을 작성해줘:\n\n${transcript}`
      if (context) {
        userPrompt = `## 환자 정보\n${context}\n\n## 오늘 내용\n${transcript}\n\n위 내용을 분석해서 기록을 작성해줘.`
      }

      const content = await callClaudeJSON({ system: prompt, user: userPrompt })

      // DB 저장
      const noteRecord = {
        inpatient_id,
        note_type: validType,
        note_date: new Date().toISOString().split('T')[0],
        content,
        transcript,
      }

      if (supabase) {
        const { data, error } = await supabase.from('inpatient_notes').insert(noteRecord).select().single()
        if (error) throw error
        return NextResponse.json({ note: data })
      }
      const local = { ...noteRecord, id: `local_${Date.now()}`, created_at: new Date().toISOString() }
      localNotes.push(local)
      return NextResponse.json({ note: local, source: 'local' })
    }

    // 퇴원 처리
    if (action === 'discharge') {
      if (supabase) {
        const { data, error } = await supabase
          .from('inpatients')
          .update({ status: 'discharged', discharge_date: new Date().toISOString().split('T')[0] })
          .eq('id', body.inpatient_id)
          .select().single()
        if (error) throw error
        return NextResponse.json({ patient: data })
      }
    }

    return NextResponse.json({ error: '잘못된 action' }, { status: 400 })
  } catch (error) {
    console.error('Inpatient error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
