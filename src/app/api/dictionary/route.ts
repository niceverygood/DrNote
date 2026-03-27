import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_MEDICAL_TERMS, type MedicalTerm } from '@/lib/medical-dictionary'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase 클라이언트 (옵셔널)
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 로컬 스토리지 (DB 없을 때 사용)
let localTerms: MedicalTerm[] = [...DEFAULT_MEDICAL_TERMS]
let nextId = 100

// GET: 모든 의학 용어 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.toLowerCase()

    // DB 연결 시도
    if (supabase) {
      let query = supabase
        .from('medical_terms')
        .select('*')
        .eq('is_active', true)
        .order('abbreviation')

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      if (search) {
        query = query.or(`abbreviation.ilike.%${search}%,full_name.ilike.%${search}%,korean_name.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        return NextResponse.json({ terms: data, source: 'database' })
      }
    }

    // 로컬 데이터 사용 (DB 없거나 비어있을 때)
    let filtered = localTerms.filter(t => t.is_active)

    if (category && category !== 'all') {
      filtered = filtered.filter(t => t.category === category)
    }

    if (search) {
      filtered = filtered.filter(t =>
        t.abbreviation.toLowerCase().includes(search) ||
        t.full_name.toLowerCase().includes(search) ||
        (t.korean_name && t.korean_name.toLowerCase().includes(search))
      )
    }

    return NextResponse.json({ terms: filtered, source: 'local' })
  } catch (error) {
    console.error('Dictionary error:', error)
    // 에러 시에도 로컬 데이터 반환
    return NextResponse.json({ terms: localTerms.filter(t => t.is_active), source: 'local' })
  }
}

// POST: 새 용어 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { abbreviation, full_name, korean_name, category, description } = body

    if (!abbreviation || !full_name) {
      return NextResponse.json(
        { error: '약어와 전체 명칭은 필수입니다.' },
        { status: 400 }
      )
    }

    // DB 연결 시도
    if (supabase) {
      const { data, error } = await supabase
        .from('medical_terms')
        .insert({
          abbreviation: abbreviation.trim(),
          full_name: full_name.trim(),
          korean_name: korean_name?.trim() || null,
          category: category || 'general',
          description: description?.trim() || null,
        })
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ term: data, source: 'database' })
      }

      if (error?.code === '23505') {
        return NextResponse.json(
          { error: '이미 존재하는 약어입니다.' },
          { status: 400 }
        )
      }
    }

    // 로컬에 추가
    const existingIndex = localTerms.findIndex(
      t => t.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase()
    )

    if (existingIndex !== -1) {
      return NextResponse.json(
        { error: '이미 존재하는 약어입니다.' },
        { status: 400 }
      )
    }

    const newTerm: MedicalTerm = {
      id: String(nextId++),
      abbreviation: abbreviation.trim(),
      full_name: full_name.trim(),
      korean_name: korean_name?.trim() || null,
      category: category || 'general',
      description: description?.trim() || null,
      is_active: true,
    }

    localTerms.push(newTerm)
    return NextResponse.json({ term: newTerm, source: 'local' })
  } catch (error) {
    console.error('Dictionary error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
