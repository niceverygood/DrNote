@AGENTS.md

## 프로젝트 개요
Dr.Note - 의사 진료 보조 AI 시스템
- 음성 녹음 → STT → CC/PI/Dx/Plan 차트 자동 생성
- Tech: Next.js 16 / React 19 / TypeScript / Supabase / OpenAI

## 주요 페이지
- `/demo` - 메인 진료 기록 (녹음→차트)
- `/counselor` - 상담사 실시간 뷰
- `/imaging` - AI 영상 분석 (GPT-4o Vision)
- `/pacs` - DICOM 뷰어
- `/dictionary` - 의학 용어 사전

## 개발 명령어
- `npm run dev` - 개발 서버 (port 3000)
- `npm run build` - 프로덕션 빌드
- `npm run lint` - ESLint

## 구현 완료
- [x] CC/PI/Dx/Plan 차트 형식
- [x] 초진/재진 구분
- [x] 추가 필드 (PMH, 수술력, 약물, 알러지)
- [x] 상담사 실시간 연동 (Supabase Realtime)
- [x] 다국어 번역 (영/중/베/일)
- [x] 환자 교육 자동생성
- [x] AI 영상 분석 (골연령/척추/무릎/일반)
- [x] PACS DICOM 뷰어

## 미구현
- [ ] CRM 시스템 (예약 알림, SMS/Push)
- [ ] 환자용 모바일 앱
