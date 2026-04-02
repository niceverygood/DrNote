# Dr.Note 기능 설명서

## 1. 서비스 개요

Dr.Note는 의사의 진료 기록 작성을 자동화하는 AI 기반 진료 보조 시스템입니다.
음성 녹음 → 텍스트 변환 → 구조화된 차트 생성 → EMR 복사까지 원스톱으로 처리합니다.

**기술 스택:** Next.js 16 / React 19 / TypeScript / Supabase / OpenAI (Whisper + GPT-4o)

---

## 2. 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 랜딩 페이지 | 서비스 소개 및 CTA |
| `/demo` | 메인 진료 기록 | 녹음 → STT → 차트 생성 |
| `/counselor` | 상담사 뷰 | 실시간 진료 요약 조회 |
| `/imaging` | AI 영상 분석 | X-ray 업로드 → AI 판독 |
| `/pacs` | PACS 뷰어 | DICOM 영상 뷰어 |
| `/dictionary` | 의학 용어 사전 | 약어/용어 관리 |

---

## 3. 핵심 기능 상세

### 3.1 음성 기반 진료 기록 자동화 (`/demo`)

**사용 흐름:**
1. 초진/재진 선택
2. 녹음 버튼 클릭 → 환자와 대화
3. 녹음 종료 → 자동으로 STT + 차트 생성
4. 결과 확인 → 추가 정보 입력 → EMR 복사

**출력 형식 (CC/PI/Dx/Plan):**

| 항목 | 설명 | 예시 |
|------|------|------|
| CC (Chief Complaint) | 주호소 | Rt elbow pain |
| PI (Present Illness) | 현병력 요약 | 2주 전 테니스 후 발생. 물건 들 때 통증 호소. |
| Dx (Diagnosis) | 의심 진단 | r/o LE, r/o epicondylitis |
| Plan | 치료 계획 | Rt elbow inj, ESWT, PT + ion |

**AI 엔진:**
- STT: OpenAI Whisper API (한국어 우선)
- 차트 생성: GPT-4o (temperature 0.3, 의료 용어 사전 주입)

---

### 3.2 초진/재진 구분

녹음 시작 전 토글 버튼으로 선택합니다.

| 구분 | CC 형식 | PI 작성 | 차트 분량 |
|------|---------|---------|----------|
| 초진 (Initial) | 부위 + 증상 | 상세 (2-3문장) | 전체 |
| 재진 (Follow-up) | 부위 + f/u | 변화 위주 간략 | 간략 |

---

### 3.3 추가 정보 입력

차트 생성 후 접이식 패널에서 수동 입력 가능:

| 필드 | 설명 | 예시 |
|------|------|------|
| PMH (Past Medical History) | 기저질환 | HTN, DM |
| Surgical History | 수술력 | Rt knee TKR (2020) |
| Medication | 현재 복용약 | Amlodipine 5mg |
| Allergy | 알러지 | NSAIDs allergy |

전체 복사 시 차트 하단에 자동 포함됩니다.

---

### 3.4 상담사 실시간 연동 (`/counselor`)

**AI 자동 생성 항목:**
- 의사 설명 내용: 의사가 환자에게 무엇을 설명했는지 한국어 요약
- 치료 결정 사유: 왜 이 치료를 권했는지 이유
- 치료 항목 목록: 결정된 치료 항목 리스트

**실시간 연동:**
- Supabase Realtime (postgres_changes) 구독
- 의사가 차트 저장 → 상담사 페이지에 즉시 알림
- 토스트 알림 + 목록 자동 갱신

**접근 권한:** 읽기 전용 (수정 불가)

---

### 3.5 다국어 번역 (`/api/translate`)

차트 하단 번역 버튼으로 활성화합니다.

| 지원 언어 | 코드 |
|----------|------|
| English | en |
| 中文 (중국어) | zh |
| Tiếng Việt (베트남어) | vi |
| 日本語 (일본어) | ja |

**특징:**
- GPT-4o 의료 특화 번역
- 의학 용어는 해당 언어 의학 용어로 정확히 번역
- 환자가 이해할 수 있도록 쉬운 설명 괄호 포함
- 각 차트 섹션(CC/PI/Dx/Plan) 아래에 번역문 표시

---

### 3.6 환자 교육 자료 자동생성 (`/api/patient-education`)

진단 섹션의 "환자 설명 생성" 버튼을 클릭하면 AI가 생성합니다.

**생성 항목:**

| 항목 | 내용 |
|------|------|
| 진단명 | 한글 질환명 |
| 설명 | 이 질환이 무엇인지 쉬운 설명 |
| 원인 | 왜 생기는지 |
| 증상 | 주요 증상 |
| 치료 | 치료 방법 |
| 주의사항 | 생활 관리 |
| 회복 기간 | 예후 |

복사 버튼으로 환자에게 문자/카톡 전달 가능합니다.

---

### 3.7 AI 영상 분석 (`/imaging`)

X-ray 영상을 업로드하면 GPT-4o Vision이 분석합니다.

**분석 모드:**

| 모드 | 대상 | 측정 항목 |
|------|------|----------|
| 골연령 검사 | 손/손목 X-ray | Bone Age, Greulich-Pyle 평가 |
| 척추 정렬 | 척추 X-ray | Cobb angle, 요추전만각, 흉추후만각, SVA |
| 무릎 정렬 | 무릎/하지 X-ray | 기계적 축, TF angle, K-L 등급 |
| 일반 판독 | 모든 부위 | 종합 소견 |

**출력:**
- 분석 소견 (Findings)
- 측정값 (Measurements) - 수치/각도
- 환자 설명용 텍스트 (복사 가능)
- EMR 차트 기재용 영문 소견 (복사 가능)

---

### 3.8 PACS 뷰어 (`/pacs`)

DICOM 의료 영상 전용 뷰어입니다.

**지원 기능:**

| 기능 | 설명 |
|------|------|
| DICOM 파일 열기 | .dcm 파일 드래그 앤 드롭 또는 파일 선택 |
| DICOMweb PACS 연동 | 병원 PACS 서버 URL 입력 → Study 조회 |
| Window/Level | 우클릭 드래그 조절 + Bone/Soft 프리셋 |
| 확대/축소 | +/- 버튼, 맞춤 |
| 회전/반전 | 90도 회전, Invert |
| 메타데이터 | 환자 정보, 촬영 정보 오버레이 |
| 캡처 → AI 분석 | 현재 영상을 /imaging으로 전송 |
| 캡처 → 클립보드 | EMR 붙여넣기용 |
| PNG 다운로드 | 영상을 PNG로 저장 |

**DICOM 렌더링:**
- 16bit/8bit 그레이스케일 지원
- MONOCHROME1/MONOCHROME2 지원
- Rescale Slope/Intercept 적용
- dicom-parser 라이브러리 기반

---

### 3.9 의학 용어 사전 (`/dictionary`)

50+ 정형외과 약어가 기본 등록되어 있습니다.

**카테고리:**
disease, anatomy, examination, procedure, treatment, imaging, abbreviation, general

**기능:**
- 검색 및 카테고리 필터
- 약어 추가/수정/삭제
- AI 프롬프트에 동적 주입 (차트 생성 시 자동 활용)
- 의사별 커스텀 약어 추가 가능

---

## 4. API 엔드포인트

| Method | 경로 | 설명 | 입력 | 출력 |
|--------|------|------|------|------|
| POST | `/api/transcribe` | 음성→텍스트 | audio file (FormData) | text, duration |
| POST | `/api/summarize` | 차트 생성 | transcript, consultation_type | chart_structured, counselor_summary, keywords |
| GET | `/api/records` | 기록 조회 | - | records[] |
| POST | `/api/records` | 기록 저장 | transcript, chart, chart_structured, ... | record |
| POST | `/api/translate` | 번역 | chart, language | translated sections |
| POST | `/api/patient-education` | 환자 교육 | diagnoses[] | education data |
| POST | `/api/image-analysis` | 영상 분석 | image (FormData), analysis_type | findings, measurements |
| GET | `/api/pacs` | PACS 조회 | pacsUrl, action | DICOM metadata |
| GET/POST | `/api/dictionary` | 용어 CRUD | category, search | terms[] |

---

## 5. 데이터베이스 스키마

### chart_records (메인 테이블)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| transcript | TEXT | STT 원문 |
| chart | TEXT | 차트 텍스트 (레거시) |
| chart_structured | JSONB | 구조화 차트 {cc, pi, diagnosis[], plan[]} |
| note | TEXT | 추가 메모 |
| keywords | TEXT[] | 추출된 키워드 |
| consultation_type | TEXT | initial / follow_up |
| additional_info | JSONB | {pmh, surgical_history, medication, allergy} |
| counselor_summary | JSONB | {explanation, treatment_reason, treatment_items[]} |
| created_at | TIMESTAMPTZ | 생성일시 |

---

## 6. 환경 변수

| 변수 | 용도 |
|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 익명 키 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 서비스 역할 키 |
| OPENAI_API_KEY | OpenAI API 키 (Whisper + GPT-4o) |
