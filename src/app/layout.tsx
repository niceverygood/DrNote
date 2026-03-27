import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const pretendard = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/pretendard/files/pretendard-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/pretendard/files/pretendard-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/pretendard/files/pretendard-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/pretendard/files/pretendard-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Dr.Note - 정형외과 AI 차트 요약',
  description: '진료 녹음을 SOAP 형식의 전문 차트로 자동 변환합니다. 정형외과 전문 약어를 활용한 AI 기반 의료 기록 솔루션.',
  keywords: ['정형외과', '진료 기록', 'SOAP', 'AI 요약', '의료 차트', 'EMR'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
