import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_MEDICAL_TERMS, type MedicalTerm } from '@/lib/medical-dictionary'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 로컬 스토리지
const localTerms: MedicalTerm[] = [...DEFAULT_MEDICAL_TERMS]

// PUT: 용어 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { abbreviation, full_name, korean_name, category, description, is_active } = body

    // DB 연결 시도
    if (supabase) {
      const updateData: Record<string, unknown> = {}
      if (abbreviation !== undefined) updateData.abbreviation = abbreviation.trim()
      if (full_name !== undefined) updateData.full_name = full_name.trim()
      if (korean_name !== undefined) updateData.korean_name = korean_name?.trim() || null
      if (category !== undefined) updateData.category = category
      if (description !== undefined) updateData.description = description?.trim() || null
      if (is_active !== undefined) updateData.is_active = is_active

      const { data, error } = await supabase
        .from('medical_terms')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ term: data, source: 'database' })
      }
    }

    // 로컬 수정
    const index = localTerms.findIndex(t => t.id === id)
    if (index === -1) {
      return NextResponse.json({ error: '용어를 찾을 수 없습니다.' }, { status: 404 })
    }

    const updatedTerm = { ...localTerms[index] }
    if (abbreviation !== undefined) updatedTerm.abbreviation = abbreviation.trim()
    if (full_name !== undefined) updatedTerm.full_name = full_name.trim()
    if (korean_name !== undefined) updatedTerm.korean_name = korean_name?.trim() || null
    if (category !== undefined) updatedTerm.category = category
    if (description !== undefined) updatedTerm.description = description?.trim() || null
    if (is_active !== undefined) updatedTerm.is_active = is_active

    localTerms[index] = updatedTerm
    return NextResponse.json({ term: updatedTerm, source: 'local' })
  } catch (error) {
    console.error('Dictionary error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// DELETE: 용어 삭제 (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // DB 연결 시도
    if (supabase) {
      const { error } = await supabase
        .from('medical_terms')
        .update({ is_active: false })
        .eq('id', id)

      if (!error) {
        return NextResponse.json({ success: true, source: 'database' })
      }
    }

    // 로컬 삭제
    const index = localTerms.findIndex(t => t.id === id)
    if (index === -1) {
      return NextResponse.json({ error: '용어를 찾을 수 없습니다.' }, { status: 404 })
    }

    localTerms[index].is_active = false
    return NextResponse.json({ success: true, source: 'local' })
  } catch (error) {
    console.error('Dictionary error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
