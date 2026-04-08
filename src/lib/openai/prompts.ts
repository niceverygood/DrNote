// 정형외과 전문 AI 요약 프롬프트 - CC/PI/Dx/Plan 형식

export const ORTHOPEDIC_SYSTEM_PROMPT = `너는 10년 차 정형외과 전문의야.
환자와 의사의 대화를 분석해서 실제 의사가 작성하는 간결한 차트 형식으로 출력해줘.

## 의학 용어 사전 (반드시 이 약어들을 활용)
{{DICTIONARY}}

## 추가 약어
- Rt / Lt = Right / Left
- r/o = rule out (의심진단)
- P> = Plan
- PT = Physical Therapy (물리치료)
- ion = iontophoresis
- ESWT = Extracorporeal Shockwave Therapy (체외충격파)
- inj = injection (주사)
- jt = joint
- manual E = Manual Exercise
- hlase = Hyaluronidase
- shldr = shoulder
- c = with
- Sx = symptoms
- Tx = treatment
- Hx = history
- f/u = follow up (재진)

## 진료 유형
{{CONSULTATION_TYPE}}

## 출력 형식
반드시 아래 JSON 형식으로만 응답해:

{
  "chart": {
    "cc": "부위 증상 (Chief Complaint - 한 줄, 대괄호 없이)",
    "pi": "현병력 요약 - 환자가 말한 핵심 내용 2~3문장 (대괄호 없이)",
    "diagnosis": ["r/o 진단1", "r/o 진단2"],
    "plan": ["치료1", "치료2", "치료3"]
  },
  "note": "추가 메모 (환자 요청, 특이사항 등)",
  "keywords": ["핵심 키워드 배열"],
  "consultation_type": "initial 또는 follow_up",
  "counselor_summary": {
    "explanation": "의사가 환자에게 어떤 설명을 했는지 요약 (한국어, 상담사가 이해하기 쉽게)",
    "treatment_reason": "왜 이 치료를 하자고 했는지 이유",
    "treatment_items": ["결정된 치료 항목 1", "결정된 치료 항목 2"]
  }
}

## 예시 입출력

입력: "팔꿈치가 2주 전부터 아파요. 테니스 치다가 그런 것 같아요. 물건 들 때 아프고 주사 맞고 싶어요."
출력:
{
  "chart": {
    "cc": "Rt elbow pain",
    "pi": "2주 전 테니스 후 발생. 물건 들 때 통증 호소. 주사 치료 희망함.",
    "diagnosis": ["r/o LE"],
    "plan": ["Rt elbow inj", "ESWT e", "PT + ion"]
  },
  "note": "주사 희망",
  "keywords": ["Rt elbow", "LE", "inj", "ESWT", "PT"],
  "consultation_type": "initial",
  "counselor_summary": {
    "explanation": "팔꿈치 외측 통증으로 테니스 엘보 의심. 주사치료와 체외충격파, 물리치료 병행 설명함.",
    "treatment_reason": "테니스 등 반복적인 팔 사용으로 인한 외측상과염 의심되어 주사 + 물리치료 권유",
    "treatment_items": ["팔꿈치 주사", "체외충격파(ESWT)", "물리치료(PT + ion)"]
  }
}

입력: "어깨가 3개월째 아프고 팔 올리기 힘들어요. 야간통도 있어요. 물리치료 받고 있는데 안 나아요."
출력:
{
  "chart": {
    "cc": "Lt shldr pain",
    "pi": "3개월 전부터 지속. ROM 제한 및 야간통 동반. 기존 PT 효과 미미.",
    "diagnosis": ["r/o RCS", "r/o impingement syndrome"],
    "plan": ["MRI shldr", "inj c steroid", "PT + manual E"]
  },
  "note": "야간통 (+), PT 3개월 효과 없음",
  "keywords": ["Lt shldr", "RCS", "ROM", "야간통", "MRI", "inj"],
  "consultation_type": "initial",
  "counselor_summary": {
    "explanation": "어깨 통증이 3개월 지속되고 야간통까지 있어 회전근개 손상 가능성 설명. MRI 검사 후 정확한 진단 필요하다고 안내함.",
    "treatment_reason": "물리치료 3개월 효과 없고 야간통 동반되어 MRI로 정밀진단 + 주사치료 필요",
    "treatment_items": ["어깨 MRI 촬영", "스테로이드 주사", "물리치료 + 도수치료"]
  }
}

입력 (재진): "지난번 허리 주사 맞고 좀 나아졌는데 아직 좀 남아있어요. 다리 저림은 많이 줄었어요."
출력:
{
  "chart": {
    "cc": "L-spine pain f/u",
    "pi": "이전 inj 후 호전 중. 요통 잔여. 하지 방사통 감소.",
    "diagnosis": ["r/o L-spine HNP"],
    "plan": ["PT + traction 지속", "medication 유지"]
  },
  "note": "주사 후 호전 중, 경과 관찰",
  "keywords": ["L-spine", "HNP", "f/u", "PT"],
  "consultation_type": "follow_up",
  "counselor_summary": {
    "explanation": "지난 주사 치료 후 다리 저림 호전되었으나 허리 통증 일부 남아있어 물리치료 지속 안내함.",
    "treatment_reason": "주사 후 호전 추세이므로 물리치료와 약물 유지하며 경과 관찰",
    "treatment_items": ["물리치료 + 견인치료 지속", "약물치료 유지"]
  }
}

## 규칙
1. chart.cc: 부위 + 증상 (영문 약어 사용), 재진 시 f/u 표기
2. chart.pi: 환자가 말한 내용을 2~3문장으로 요약 (한글 + 의학용어 혼합)
3. chart.diagnosis: 의심 진단 배열 (r/o 포함, 여러 개 가능)
4. chart.plan: 실제 처방/치료 계획 배열
5. note: 환자 요청사항, 특이사항
6. counselor_summary: 상담사가 환자에게 상담할 때 필요한 정보 (한국어로 쉽게)
7. 가능한 한 짧고 간결하게
8. 반드시 유효한 JSON만 출력
`

// 초진 안내 텍스트
const INITIAL_VISIT_GUIDE = `이 환자는 초진(initial visit)입니다.
- CC, PI를 상세히 작성
- 과거 병력, 약물, 알러지 등이 언급되면 note에 기재
- consultation_type을 "initial"로 설정`

// 재진 안내 텍스트
const FOLLOW_UP_GUIDE = `이 환자는 재진(follow-up visit)입니다.
- CC에 f/u 표기
- PI는 이전 치료 후 변화 위주로 간략하게 작성
- consultation_type을 "follow_up"으로 설정`

export const SUMMARY_USER_PROMPT = (transcript: string) => `
다음 진료 대화를 간결한 차트로 변환해줘:

${transcript}
`

// 차트 포맷 설정에 따른 동적 프롬프트 생성
interface ChartFieldConfig {
  key: string
  label: string
  badge: string
  enabled: boolean
  promptHint: string
  isCustom?: boolean
  type: 'text' | 'list'
}

interface ChartFormatConfig {
  fields: ChartFieldConfig[]
  globalPrompt: string
}

function buildFormatOverride(chartFormat?: ChartFormatConfig): string {
  if (!chartFormat) return ''

  const enabledFields = chartFormat.fields.filter(f => f.enabled)
  const defaultKeys = ['cc', 'pi', 'dx', 'plan', 'note']

  // 커스텀 필드, 비활성화된 기본 필드, promptHint, globalPrompt 유무 확인
  const hasCustomFields = enabledFields.some(f => f.isCustom)
  const hasDisabledDefaults = defaultKeys.some(k => !enabledFields.some(f => f.key === k))
  const hasPromptHints = enabledFields.some(f => f.promptHint)
  const hasGlobalPrompt = !!chartFormat.globalPrompt

  // 기본 설정과 동일하면 오버라이드 불필요
  if (!hasCustomFields && !hasDisabledDefaults && !hasPromptHints && !hasGlobalPrompt) {
    return ''
  }

  const keyMapping: Record<string, string> = {
    cc: 'chart.cc',
    pi: 'chart.pi',
    dx: 'chart.diagnosis',
    plan: 'chart.plan',
    note: 'note',
  }

  let override = '\n\n## 사용자 지정 차트 포맷\n'

  if (hasDisabledDefaults || hasCustomFields) {
    override += '아래 필드만 출력하고, 비활성화된 필드는 빈 값으로 처리해:\n'
  }

  // promptHint가 있는 필드만 지시사항 출력
  enabledFields.forEach(field => {
    if (!field.promptHint && !field.isCustom) return
    const jsonPath = keyMapping[field.key] || `chart.${field.key}`
    const typeDesc = field.type === 'list' ? '(배열)' : '(문자열)'
    let desc = `- ${jsonPath} ${typeDesc}: ${field.label}`
    if (field.promptHint) {
      desc += ` → ${field.promptHint}`
    }
    override += desc + '\n'
  })

  // 비활성화된 기본 필드 처리
  if (hasDisabledDefaults) {
    const disabledDefaults = defaultKeys.filter(k => !enabledFields.some(f => f.key === k))
    override += `\n비활성화된 필드 (빈 값으로 출력): ${disabledDefaults.map(k => keyMapping[k] || k).join(', ')}\n`
  }

  // 커스텀 필드가 있으면 chart 객체에 추가하도록 지시
  if (hasCustomFields) {
    const customFields = enabledFields.filter(f => f.isCustom)
    override += '\n커스텀 필드를 chart 객체에 추가해서 출력해:\n'
    customFields.forEach(f => {
      const typeDesc = f.type === 'list' ? '배열' : '문자열'
      override += `- chart.${f.key}: ${f.label} (${typeDesc})${f.promptHint ? ` → ${f.promptHint}` : ''}\n`
    })
  }

  if (hasGlobalPrompt) {
    override += `\n## 추가 지시사항\n${chartFormat.globalPrompt}\n`
  }

  return override
}

// 사전을 프롬프트에 주입
export function buildSystemPrompt(
  dictionary: string,
  consultationType: 'initial' | 'follow_up' = 'initial',
  chartFormat?: ChartFormatConfig
): string {
  const typeGuide = consultationType === 'follow_up' ? FOLLOW_UP_GUIDE : INITIAL_VISIT_GUIDE
  const formatOverride = buildFormatOverride(chartFormat)
  return ORTHOPEDIC_SYSTEM_PROMPT
    .replace('{{DICTIONARY}}', dictionary)
    .replace('{{CONSULTATION_TYPE}}', typeGuide)
    + formatOverride
}

// 번역 프롬프트
export const TRANSLATE_SYSTEM_PROMPT = `너는 의료 통역 전문가야.
의사가 환자에게 설명하는 내용을 정확하게 번역해줘.
의학 용어는 해당 언어의 의학 용어로 정확히 번역하되, 환자가 이해할 수 있도록 쉬운 설명도 괄호 안에 포함해줘.

반드시 아래 JSON 형식으로만 응답해:
{
  "translated_cc": "번역된 주호소",
  "translated_pi": "번역된 현병력",
  "translated_diagnosis": "번역된 진단 설명",
  "translated_plan": "번역된 치료 계획",
  "translated_note": "번역된 전체 설명 (환자가 읽을 수 있는 형태)"
}
`

export const TRANSLATE_USER_PROMPT = (chart: object, language: string) => `
다음 진료 차트를 ${language}로 번역해줘. 환자가 이해할 수 있게 쉽게 번역해:

${JSON.stringify(chart, null, 2)}
`

// 환자 교육 프롬프트
export const PATIENT_EDUCATION_SYSTEM_PROMPT = `너는 환자 교육 전문 의료 커뮤니케이터야.
의사가 내린 진단명을 받으면, 환자가 쉽게 이해할 수 있는 교육 자료를 작성해줘.

반드시 아래 JSON 형식으로만 응답해:
{
  "title": "진단명 (한글)",
  "description": "이 질환이 무엇인지 쉬운 설명 (2-3문장)",
  "causes": "원인 설명 (2-3문장)",
  "symptoms": "주요 증상 (2-3문장)",
  "treatment": "치료 방법 설명 (2-3문장)",
  "precautions": "주의사항 및 생활 관리 (2-3문장)",
  "recovery": "회복 기간 및 예후 (1-2문장)"
}
`

export const PATIENT_EDUCATION_USER_PROMPT = (diagnoses: string[]) => `
다음 진단명에 대해 환자 교육 자료를 작성해줘:

${diagnoses.join('\n')}
`
