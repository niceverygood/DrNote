// 정형외과 스마트 처방 추천 데이터베이스

export interface Medication {
  name: string
  nameKo: string
  dose: string
  frequency: string
  duration: string
  category: '진통소염제' | '근이완제' | '위장보호제' | '외용제' | '신경병증약' | '골다공증약' | '기타'
  note?: string
}

export interface PrescriptionSet {
  name: string
  nameKo: string
  keywords: string[]           // 진단 매칭용 키워드
  medications: Medication[]
  additionalNote?: string
}

// === 처방 세트 ===
export const PRESCRIPTION_SETS: PrescriptionSet[] = [
  // 상과염 (테니스엘보/골프엘보)
  {
    name: 'Epicondylitis',
    nameKo: '상과염 (테니스/골프엘보)',
    keywords: ['le', 'me', 'lateral epicondylitis', 'medial epicondylitis', 'tennis elbow', 'golfer elbow', '상과염', '테니스엘보', '골프엘보'],
    medications: [
      { name: 'Celecoxib', nameKo: '셀레콕시브', dose: '200mg', frequency: '1일 1회', duration: '7일', category: '진통소염제' },
      { name: 'Acetaminophen', nameKo: '아세트아미노펜', dose: '500mg', frequency: '1일 3회', duration: '7일', category: '진통소염제' },
      { name: 'Ketoprofen Patch', nameKo: '케토프로펜 패치', dose: '30mg', frequency: '1일 1~2회 부착', duration: '7일', category: '외용제' },
    ],
    additionalNote: 'ESWT 2~3주 병행 시 효과적, 팔꿈치 보조기 착용 권장',
  },

  // 회전근개
  {
    name: 'Rotator Cuff',
    nameKo: '회전근개 질환',
    keywords: ['rcs', 'rotator cuff', '회전근개', 'rc tear', 'supraspinatus', 'impingement', '충돌증후군'],
    medications: [
      { name: 'Aceclofenac', nameKo: '아세클로페낙', dose: '100mg', frequency: '1일 2회', duration: '14일', category: '진통소염제' },
      { name: 'Eperisone', nameKo: '에페리손', dose: '50mg', frequency: '1일 3회', duration: '14일', category: '근이완제' },
      { name: 'Rebamipide', nameKo: '레바미피드', dose: '100mg', frequency: '1일 3회', duration: '14일', category: '위장보호제' },
      { name: 'Diclofenac Gel', nameKo: '디클로페낙 겔', dose: '1%', frequency: '1일 3~4회 도포', duration: '14일', category: '외용제' },
    ],
    additionalNote: 'MRI 검사 후 파열 정도에 따라 수술적 치료 고려',
  },

  // 오십견
  {
    name: 'Frozen Shoulder',
    nameKo: '유착성관절낭염 (오십견)',
    keywords: ['adhesive capsulitis', 'frozen shoulder', '오십견', '동결견', '유착'],
    medications: [
      { name: 'Loxoprofen', nameKo: '록소프로펜', dose: '60mg', frequency: '1일 3회', duration: '14일', category: '진통소염제' },
      { name: 'Tizanidine', nameKo: '티자니딘', dose: '2mg', frequency: '1일 3회', duration: '14일', category: '근이완제' },
      { name: 'Esomeprazole', nameKo: '에스오메프라졸', dose: '20mg', frequency: '1일 1회', duration: '14일', category: '위장보호제' },
    ],
    additionalNote: '적극적 ROM 운동 필수, 도수치료 병행 권장',
  },

  // 요추 디스크
  {
    name: 'Lumbar HNP',
    nameKo: '요추간판탈출증 (허리디스크)',
    keywords: ['hnp', 'hivd', 'l-spine', 'disc herniation', '허리디스크', '추간판탈출', 'l-hivd', 'lumbar disc', 'lbp'],
    medications: [
      { name: 'Celecoxib', nameKo: '셀레콕시브', dose: '200mg', frequency: '1일 2회', duration: '14일', category: '진통소염제' },
      { name: 'Pregabalin', nameKo: '프레가발린', dose: '75mg', frequency: '1일 2회', duration: '14일', category: '신경병증약', note: '방사통 있을 시' },
      { name: 'Eperisone', nameKo: '에페리손', dose: '50mg', frequency: '1일 3회', duration: '14일', category: '근이완제' },
      { name: 'Rebamipide', nameKo: '레바미피드', dose: '100mg', frequency: '1일 3회', duration: '14일', category: '위장보호제' },
    ],
    additionalNote: '견인치료 병행, 증상 지속 시 경막외주사(epidural) 고려',
  },

  // 경추 디스크
  {
    name: 'Cervical HNP',
    nameKo: '경추간판탈출증 (목디스크)',
    keywords: ['c-spine', 'cervical disc', '목디스크', '경추디스크', 'c-hnp', 'c-hivd', 'cervicalgia', 'neck pain', '경부통'],
    medications: [
      { name: 'Naproxen', nameKo: '나프록센', dose: '500mg', frequency: '1일 2회', duration: '10일', category: '진통소염제' },
      { name: 'Pregabalin', nameKo: '프레가발린', dose: '75mg', frequency: '1일 2회', duration: '14일', category: '신경병증약', note: '상지 방사통 시' },
      { name: 'Tizanidine', nameKo: '티자니딘', dose: '2mg', frequency: '1일 3회', duration: '10일', category: '근이완제' },
      { name: 'Esomeprazole', nameKo: '에스오메프라졸', dose: '20mg', frequency: '1일 1회', duration: '10일', category: '위장보호제' },
    ],
    additionalNote: '경추 견인치료 병행, 일자목/역C자 교정운동 안내',
  },

  // 무릎 관절염
  {
    name: 'Knee OA',
    nameKo: '무릎 퇴행성관절염',
    keywords: ['knee oa', 'gonarthrosis', '무릎관절염', '퇴행성 무릎', 'degenerative knee'],
    medications: [
      { name: 'Aceclofenac', nameKo: '아세클로페낙', dose: '100mg', frequency: '1일 2회', duration: '14일', category: '진통소염제' },
      { name: 'Glucosamine', nameKo: '글루코사민', dose: '1500mg', frequency: '1일 1회', duration: '90일', category: '기타', note: '연골보호 목적' },
      { name: 'Rebamipide', nameKo: '레바미피드', dose: '100mg', frequency: '1일 3회', duration: '14일', category: '위장보호제' },
      { name: 'Ketoprofen Patch', nameKo: '케토프로펜 패치', dose: '30mg', frequency: '1일 1~2회 부착', duration: '14일', category: '외용제' },
    ],
    additionalNote: 'HA(히알루론산) 관절주사 5주 1코스, 체중감량 및 근력운동 권장',
  },

  // 반월판 손상
  {
    name: 'Meniscus',
    nameKo: '반월판 손상',
    keywords: ['meniscus', '반월판', 'meniscal tear', '내측반월판', '외측반월판'],
    medications: [
      { name: 'Celecoxib', nameKo: '셀레콕시브', dose: '200mg', frequency: '1일 2회', duration: '14일', category: '진통소염제' },
      { name: 'Acetaminophen', nameKo: '아세트아미노펜', dose: '650mg', frequency: '1일 3회', duration: '14일', category: '진통소염제' },
    ],
    additionalNote: 'MRI 확인 필수, 잠김증상(locking) 있으면 관절경 수술 고려',
  },

  // 족저근막염
  {
    name: 'Plantar Fasciitis',
    nameKo: '족저근막염',
    keywords: ['plantar fasciitis', '족저근막', 'heel pain', '발바닥통증', '발뒤꿈치'],
    medications: [
      { name: 'Loxoprofen', nameKo: '록소프로펜', dose: '60mg', frequency: '1일 3회', duration: '14일', category: '진통소염제' },
      { name: 'Rebamipide', nameKo: '레바미피드', dose: '100mg', frequency: '1일 3회', duration: '14일', category: '위장보호제' },
      { name: 'Diclofenac Gel', nameKo: '디클로페낙 겔', dose: '1%', frequency: '1일 3~4회 도포', duration: '14일', category: '외용제' },
    ],
    additionalNote: 'ESWT 효과적, 맞춤 깔창(insole) 처방 권장, 스트레칭 교육',
  },

  // 손목/손 질환
  {
    name: 'Hand/Wrist',
    nameKo: '수부/수근관 질환',
    keywords: ['cts', 'carpal tunnel', '수근관', 'de quervain', '드퀘르벵', 'trigger finger', '방아쇠'],
    medications: [
      { name: 'Naproxen', nameKo: '나프록센', dose: '500mg', frequency: '1일 2회', duration: '7일', category: '진통소염제' },
      { name: 'Pregabalin', nameKo: '프레가발린', dose: '75mg', frequency: '1일 2회', duration: '14일', category: '신경병증약', note: 'CTS 저림 시' },
      { name: 'Ketoprofen Patch', nameKo: '케토프로펜 패치', dose: '30mg', frequency: '1일 1회 부착', duration: '7일', category: '외용제' },
    ],
    additionalNote: '야간 손목보호대(wrist splint) 착용 권장',
  },

  // 발목 염좌
  {
    name: 'Ankle Sprain',
    nameKo: '발목 염좌',
    keywords: ['ankle sprain', '발목염좌', '발목 삐었', 'atfl', 'ankle inversion'],
    medications: [
      { name: 'Ibuprofen', nameKo: '이부프로펜', dose: '400mg', frequency: '1일 3회', duration: '7일', category: '진통소염제' },
      { name: 'Acetaminophen', nameKo: '아세트아미노펜', dose: '500mg', frequency: '1일 3회', duration: '7일', category: '진통소염제' },
      { name: 'Diclofenac Gel', nameKo: '디클로페낙 겔', dose: '1%', frequency: '1일 3~4회 도포', duration: '7일', category: '외용제' },
    ],
    additionalNote: 'RICE 원칙 교육, 보조기 착용, Grade 확인 후 고정 결정',
  },

  // 골다공증
  {
    name: 'Osteoporosis',
    nameKo: '골다공증',
    keywords: ['osteoporosis', '골다공증', 'bone density', 'dexa'],
    medications: [
      { name: 'Alendronate', nameKo: '알렌드로네이트', dose: '70mg', frequency: '주 1회', duration: '지속', category: '골다공증약', note: '공복, 기상 후 30분 전 복용' },
      { name: 'Calcium + Vit D', nameKo: '칼슘+비타민D', dose: '500mg/1000IU', frequency: '1일 1회', duration: '지속', category: '골다공증약' },
    ],
    additionalNote: 'DEXA 추적검사 1~2년마다, 낙상 예방 교육',
  },

  // 통풍
  {
    name: 'Gout',
    nameKo: '통풍',
    keywords: ['gout', '통풍', 'uric acid'],
    medications: [
      { name: 'Colchicine', nameKo: '콜히친', dose: '0.6mg', frequency: '1일 2회', duration: '급성기', category: '기타', note: '급성 발작 시' },
      { name: 'Naproxen', nameKo: '나프록센', dose: '500mg', frequency: '1일 2회', duration: '7일', category: '진통소염제' },
      { name: 'Febuxostat', nameKo: '페북소스타트', dose: '40mg', frequency: '1일 1회', duration: '지속', category: '기타', note: '요산 저하제, 급성기 지난 후' },
    ],
    additionalNote: '수분 섭취 권장, 퓨린 식이 교육',
  },

  // 일반 근골격 통증
  {
    name: 'General MSK Pain',
    nameKo: '일반 근골격 통증',
    keywords: ['myalgia', '근육통', 'muscle pain', 'strain', '좌상', 'pain', '통증', 'muscle strain'],
    medications: [
      { name: 'Ibuprofen', nameKo: '이부프로펜', dose: '400mg', frequency: '1일 3회', duration: '7일', category: '진통소염제' },
      { name: 'Eperisone', nameKo: '에페리손', dose: '50mg', frequency: '1일 3회', duration: '7일', category: '근이완제' },
      { name: 'Ketoprofen Patch', nameKo: '케토프로펜 패치', dose: '30mg', frequency: '1일 1~2회 부착', duration: '7일', category: '외용제' },
    ],
  },
]

// === 매칭 로직 ===

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9가-힣\s\/\-]/g, ' ').trim()
}

function matchScore(text: string, keywords: string[]): number {
  const normalized = normalizeText(text)
  let score = 0
  for (const keyword of keywords) {
    if (normalized.includes(normalizeText(keyword))) {
      score += keyword.length
    }
  }
  return score
}

export function matchPrescriptions(diagnoses: string[], plans: string[]): PrescriptionSet[] {
  const combined = [...diagnoses, ...plans].join(' ')

  const scored = PRESCRIPTION_SETS
    .map(set => ({ set, score: matchScore(combined, set.keywords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  // 상위 3개 세트
  return scored.slice(0, 3).map(({ set }) => set)
}
