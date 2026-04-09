import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ profile: null })

  if (supabase) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return NextResponse.json({ profile: data })
  }
  return NextResponse.json({ profile: null })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, email, avatar_url, role, hospital_name, hospital_type } = body

    if (!user_id || !role || !hospital_type) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id,
          name: name || null,
          email: email || null,
          avatar_url: avatar_url || null,
          role,
          hospital_name: hospital_name || null,
          hospital_type,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        console.error('Profile upsert error:', error)
        return NextResponse.json({ error: '저장 실패' }, { status: 500 })
      }
      return NextResponse.json({ profile: data })
    }

    return NextResponse.json({
      profile: { user_id, role, hospital_type, onboarding_complete: true },
      source: 'local',
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
