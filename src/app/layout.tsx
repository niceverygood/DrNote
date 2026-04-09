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
  title: 'Dr.Note — AI가 기록하고, 의사는 치료합니다',
  description: 'AI가 진료 중 대화를 실시간으로 분석하여 KCD 코드와 EMR 입력 데이터를 자동 생성합니다.',
  keywords: ['정형외과', '진료 기록', 'AI 차트', 'KCD', 'EMR', 'Dr.Note'],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable}`}>
      <head>
        <meta name="theme-color" content="#0F1C3A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dr.Note" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
