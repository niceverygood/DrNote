import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// GET: 기록 목록 조회
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ records: [], source: 'no-db' })
  }

  try {
    const { data, error } = await supabase
      .from('chart_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Records fetch error:', error)
      return NextResponse.json({ records: [], error: error.message })
    }

    return NextResponse.json({ records: data || [] })
  } catch (error) {
    console.error('Records error:', error)
    return NextResponse.json({ records: [], error: 'Server error' })
  }
}

// POST: 새 기록 저장
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'DB not connected' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      transcript,
      chart,
      note,
      keywords,
      consultation_type,
      chart_structured,
      additional_info,
      counselor_summary,
    } = body

    if (!transcript || !chart) {
      return NextResponse.json(
        { error: 'transcript와 chart는 필수입니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('chart_records')
      .insert({
        transcript,
        chart,
        note: note || null,
        keywords: keywords || [],
        consultation_type: consultation_type || 'initial',
        chart_structured: chart_structured || {},
        additional_info: additional_info || {},
        counselor_summary: counselor_summary || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Record insert error:', error)
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ record: data })
  } catch (error) {
    console.error('Records error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
