'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleKakaoLogin = async () => {
    setLoading(true)
    setError('')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Supabase 미설정 시 바로 온보딩으로 (데모 모드)
      window.location.href = '/onboarding'
      return
    }

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseKey)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `https://drnote.co.kr/api/auth/callback`,
        },
      })
      if (error) {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
        setLoading(false)
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dr.Note</h1>
          <p className="text-gray-500 mt-2">AI 진료 보조 시스템</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-6">로그인</h2>

          {/* Kakao Login */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#FEE500', color: '#191919' }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3C5.58 3 2 5.79 2 9.25C2 11.44 3.56 13.36 5.86 14.42L5.07 17.35C5.01 17.56 5.25 17.73 5.44 17.6L8.88 15.38C9.25 15.43 9.62 15.46 10 15.46C14.42 15.46 18 12.67 18 9.25C18 5.79 14.42 3 10 3Z" fill="#191919"/>
              </svg>
            )}
            카카오 로그인
          </button>

          {/* Demo Mode */}
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.href = '/onboarding'}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그인 없이 체험하기
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          로그인 시 서비스 이용약관에 동의합니다.
        </p>
      </div>
    </div>
  )
}
