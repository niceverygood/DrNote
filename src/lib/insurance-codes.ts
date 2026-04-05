// 정형외과 보험 청구 코드 데이터베이스
// KCD: 한국표준질병사인분류 (진단코드)
// EDI: 건강보험 수가코드 (처치/치료코드)

export interface KCDCode {
  code: string
  name: string
  nameKo: string
  keywords: string[]  // 매칭용 키워드
}

export interface EDICode {
  code: string
  name: string
  nameKo: string
  category: '처치' | '검사' | '물리치료' | '주사' | '영상' | '기타'
  keywords: string[]
}

export interface InsuranceCodeMatch {
  kcd: KCDCode[]
  edi: EDICode[]
}

// === KCD 상병코드 (정형외과 주요) ===
export const KCD_CODES: KCDCode[] = [
  // 어깨
  { code: 'M75.1', name: 'Rotator Cuff Syndrome', nameKo: '회전근개증후군', keywords: ['rcs', 'rotator cuff', '회전근개', 'rc tear', 'rc lesion', 'supraspinatus'] },
  { code: 'M75.0', name: 'Adhesive Capsulitis', nameKo: '유착성관절낭염(오십견)', keywords: ['adhesive capsulitis', 'frozen shoulder', '오십견', '동결견', '유착'] },
  { code: 'M75.3', name: 'Calcific Tendinitis of Shoulder', nameKo: '어깨석회성건염', keywords: ['calcific tendinitis', '석회성건염', '석회', 'calcification', 'shldr calcific'] },
  { code: 'M75.4', name: 'Impingement Syndrome of Shoulder', nameKo: '어깨충돌증후군', keywords: ['impingement', '충돌증후군', 'impingement syndrome', 'shldr impingement'] },
  { code: 'S43.4', name: 'Sprain of Shoulder Joint', nameKo: '어깨관절염좌', keywords: ['shoulder sprain', '어깨 염좌', 'shldr sprain', 'ac joint'] },
  { code: 'M19.01', name: 'Primary OA of Shoulder', nameKo: '어깨관절증', keywords: ['shoulder oa', 'shldr oa', '어깨 관절염', 'glenohumeral oa'] },

  // 팔꿈치
  { code: 'M77.1', name: 'Lateral Epicondylitis', nameKo: '외측상과염(테니스엘보)', keywords: ['le', 'lateral epicondylitis', 'tennis elbow', '테니스엘보', '외측상과염', '테니스 엘보'] },
  { code: 'M77.0', name: 'Medial Epicondylitis', nameKo: '내측상과염(골프엘보)', keywords: ['me', 'medial epicondylitis', 'golfer elbow', '골프엘보', '내측상과염', '골프 엘보', "golfer's elbow"] },
  { code: 'G56.2', name: 'Cubital Tunnel Syndrome', nameKo: '주관증후군', keywords: ['cubital tunnel', '주관증후군', 'ulnar neuropathy', 'cubital'] },

  // 손/손목
  { code: 'M65.4', name: "De Quervain's Tenosynovitis", nameKo: '드퀘르벵건초염', keywords: ['de quervain', '드퀘르벵', 'dequervain', '건초염'] },
  { code: 'G56.0', name: 'Carpal Tunnel Syndrome', nameKo: '수근관증후군', keywords: ['cts', 'carpal tunnel', '수근관', '손목터널'] },
  { code: 'M65.3', name: 'Trigger Finger', nameKo: '방아쇠손가락', keywords: ['trigger finger', '방아쇠', 'trigger thumb', '탄발지'] },
  { code: 'M72.0', name: "Dupuytren's Contracture", nameKo: '뒤퓌트렌구축', keywords: ['dupuytren', '뒤퓌트렌'] },

  // 척추
  { code: 'M51.1', name: 'Lumbar Disc Herniation', nameKo: '요추간판탈출증(허리디스크)', keywords: ['hnp', 'hivd', 'l-spine hnp', 'disc herniation', '허리디스크', '추간판탈출', 'l-hivd', 'lumbar disc'] },
  { code: 'M51.0', name: 'Cervical Disc Herniation', nameKo: '경추간판탈출증(목디스크)', keywords: ['c-spine hnp', 'c-hivd', 'cervical disc', '목디스크', '경추디스크'] },
  { code: 'M54.5', name: 'Low Back Pain', nameKo: '요통', keywords: ['lbp', 'low back pain', '요통', 'l-spine pain', '허리통증'] },
  { code: 'M54.2', name: 'Cervicalgia', nameKo: '경부통', keywords: ['neck pain', '목통증', 'cervicalgia', 'c-spine pain', '경부통'] },
  { code: 'M48.0', name: 'Spinal Stenosis', nameKo: '척추관협착증', keywords: ['spinal stenosis', '협착증', 'stenosis', 'lss'] },
  { code: 'M47.8', name: 'Spondylosis', nameKo: '척추증', keywords: ['spondylosis', '척추증', '퇴행성 척추'] },
  { code: 'M53.1', name: 'Cervicobrachial Syndrome', nameKo: '경완증후군', keywords: ['cervicobrachial', '경완증후군'] },
  { code: 'M43.1', name: 'Spondylolisthesis', nameKo: '척추전방전위증', keywords: ['spondylolisthesis', '전방전위', '전위증'] },

  // 무릎
  { code: 'M23.2', name: 'Meniscus Derangement', nameKo: '반월판손상', keywords: ['meniscus', '반월판', 'meniscal tear', '내측반월판', '외측반월판'] },
  { code: 'M17.1', name: 'Primary Gonarthrosis', nameKo: '무릎관절증', keywords: ['knee oa', 'gonarthrosis', '무릎관절염', '퇴행성 무릎', 'degenerative knee'] },
  { code: 'M76.5', name: 'Patellar Tendinitis', nameKo: '슬개건염', keywords: ['patellar tendinitis', '슬개건염', 'jumper knee', "jumper's knee"] },
  { code: 'M22.0', name: 'Patellar Dislocation', nameKo: '슬개골탈구', keywords: ['patellar dislocation', '슬개골 탈구', '슬개골 불안정'] },
  { code: 'M22.4', name: 'Chondromalacia Patellae', nameKo: '슬개골연골연화증', keywords: ['chondromalacia', '연골연화', 'cmp', 'pfps'] },
  { code: 'S83.5', name: 'ACL Injury', nameKo: '전방십자인대손상', keywords: ['acl', 'anterior cruciate', '전방십자인대', 'acl tear', 'acl injury'] },
  { code: 'S83.4', name: 'MCL Injury', nameKo: '내측측부인대손상', keywords: ['mcl', 'medial collateral', '내측측부인대', 'mcl tear'] },
  { code: 'M70.4', name: 'Prepatellar Bursitis', nameKo: '슬개전활액낭염', keywords: ['prepatellar bursitis', '활액낭염', 'bursitis knee'] },

  // 발/발목
  { code: 'M72.2', name: 'Plantar Fasciitis', nameKo: '족저근막염', keywords: ['plantar fasciitis', '족저근막염', 'heel pain', '발바닥통증', '발뒤꿈치'] },
  { code: 'S93.4', name: 'Ankle Sprain', nameKo: '발목염좌', keywords: ['ankle sprain', '발목염좌', '발목 삐었', 'atfl', 'ankle inversion'] },
  { code: 'M77.5', name: 'Achilles Tendinitis', nameKo: '아킬레스건염', keywords: ['achilles', '아킬레스', 'achilles tendinitis', 'achilles tendon'] },
  { code: 'M20.1', name: 'Hallux Valgus', nameKo: '무지외반증', keywords: ['hallux valgus', '무지외반', 'bunion'] },

  // 고관절
  { code: 'M16.1', name: 'Primary Coxarthrosis', nameKo: '고관절증', keywords: ['hip oa', 'coxarthrosis', '고관절 관절염', 'hip osteoarthritis'] },
  { code: 'M25.5', name: 'Hip Pain', nameKo: '관절통', keywords: ['hip pain', '고관절 통증', '엉덩이 통증'] },

  // 근육/힘줄/인대 일반
  { code: 'M79.1', name: 'Myalgia', nameKo: '근육통', keywords: ['myalgia', '근육통', 'muscle pain', 'muscle strain'] },
  { code: 'M79.6', name: 'Pain in Limb', nameKo: '사지통증', keywords: ['limb pain', '사지통증', 'arm pain', 'leg pain'] },
  { code: 'M62.8', name: 'Muscle Strain', nameKo: '근육 좌상', keywords: ['muscle strain', '근육 좌상', 'strain', '좌상'] },
  { code: 'M79.3', name: 'Panniculitis', nameKo: '지방층염', keywords: ['panniculitis', '지방층염'] },

  // 골절/외상
  { code: 'S52.5', name: 'Fracture of Lower End of Radius', nameKo: '요골원위단골절', keywords: ['colles', 'distal radius fracture', '요골골절', 'wrist fracture'] },
  { code: 'S42.2', name: 'Fracture of Upper End of Humerus', nameKo: '상완골근위단골절', keywords: ['proximal humerus fracture', '상완골골절', 'humerus fracture'] },
  { code: 'S82.6', name: 'Fracture of Lateral Malleolus', nameKo: '외과골절', keywords: ['lateral malleolus fracture', '외과골절', 'ankle fracture'] },

  // 기타
  { code: 'M79.0', name: 'Rheumatism', nameKo: '류마티즘', keywords: ['rheumatism', '류마티즘'] },
  { code: 'M10.9', name: 'Gout', nameKo: '통풍', keywords: ['gout', '통풍', 'uric acid'] },
  { code: 'M81.0', name: 'Osteoporosis', nameKo: '골다공증', keywords: ['osteoporosis', '골다공증', 'bone density'] },
]

// === EDI 수가코드 (정형외과 주요) ===
export const EDI_CODES: EDICode[] = [
  // 물리치료
  { code: 'MM101', name: 'Superficial Heat Therapy', nameKo: '표재열치료(핫팩)', category: '물리치료', keywords: ['hot pack', '핫팩', '온열치료', 'heat'] },
  { code: 'MM301', name: 'Deep Heat Therapy - Ultrasound', nameKo: '심부열치료(초음파)', category: '물리치료', keywords: ['ultrasound', '초음파', 'us'] },
  { code: 'MM040', name: 'Transcutaneous Electrical Nerve Stimulation', nameKo: '경피신경전기자극(TENS)', category: '물리치료', keywords: ['tens', '전기치료', '경피신경자극'] },
  { code: 'MM060', name: 'Interferential Current Therapy', nameKo: '간섭전류치료(ICT)', category: '물리치료', keywords: ['ict', '간섭전류', 'interferential'] },
  { code: 'MX032', name: 'Extracorporeal Shockwave Therapy', nameKo: '체외충격파치료(ESWT)', category: '물리치료', keywords: ['eswt', '충격파', 'shockwave', '체외충격파'] },
  { code: 'MM015', name: 'Iontophoresis', nameKo: '이온도입치료', category: '물리치료', keywords: ['ion', 'iontophoresis', '이온도입'] },
  { code: 'MX121', name: 'Traction Therapy - Cervical', nameKo: '경추 견인치료', category: '물리치료', keywords: ['c-traction', '경추 견인', 'cervical traction'] },
  { code: 'MX122', name: 'Traction Therapy - Lumbar', nameKo: '요추 견인치료', category: '물리치료', keywords: ['l-traction', '요추 견인', 'lumbar traction', 'traction'] },
  { code: 'MX035', name: 'Cryotherapy', nameKo: '냉각치료', category: '물리치료', keywords: ['ice', 'cryotherapy', '냉각', '냉치료', '아이싱'] },
  { code: 'MM070', name: 'Laser Therapy', nameKo: '레이저치료', category: '물리치료', keywords: ['laser', '레이저', 'hlase', 'lllt'] },

  // 도수치료
  { code: 'MY142', name: 'Manual Therapy', nameKo: '도수치료', category: '물리치료', keywords: ['manual', '도수치료', 'manual therapy', 'manual e', 'pt'] },

  // 주사
  { code: 'LA312', name: 'Joint Injection - Shoulder', nameKo: '어깨관절주사', category: '주사', keywords: ['shldr inj', 'shoulder injection', '어깨주사', '어깨 inj'] },
  { code: 'LA313', name: 'Joint Injection - Elbow', nameKo: '팔꿈치관절주사', category: '주사', keywords: ['elbow inj', 'elbow injection', '팔꿈치주사', '팔꿈치 inj'] },
  { code: 'LA314', name: 'Joint Injection - Wrist', nameKo: '손목관절주사', category: '주사', keywords: ['wrist inj', 'wrist injection', '손목주사'] },
  { code: 'LA316', name: 'Joint Injection - Knee', nameKo: '무릎관절주사', category: '주사', keywords: ['knee inj', 'knee injection', '무릎주사', '무릎 inj'] },
  { code: 'LA318', name: 'Joint Injection - Hip', nameKo: '고관절주사', category: '주사', keywords: ['hip inj', 'hip injection', '고관절주사'] },
  { code: 'LA321', name: 'Trigger Point Injection', nameKo: '통증유발점주사(TPI)', category: '주사', keywords: ['tpi', 'trigger point', '통증유발점', '트리거포인트'] },
  { code: 'LA322', name: 'Nerve Block', nameKo: '신경차단술', category: '주사', keywords: ['nerve block', '신경차단', 'block', '차단술'] },
  { code: 'LA341', name: 'Epidural Injection', nameKo: '경막외주사', category: '주사', keywords: ['epidural', '경막외', 'epi inj', 'epidural injection'] },
  { code: 'LA349', name: 'Prolotherapy', nameKo: '프롤로치료(인대강화주사)', category: '주사', keywords: ['prolo', 'prolotherapy', '프롤로', '인대강화'] },
  { code: 'N/A', name: 'PRP Injection', nameKo: 'PRP(자가혈소판) 주사', category: '주사', keywords: ['prp', '자가혈소판', 'platelet rich plasma'] },
  { code: 'LA399', name: 'Soft Tissue Injection', nameKo: '연부조직주사', category: '주사', keywords: ['inj', 'injection', '주사', 'steroid', '스테로이드'] },

  // 영상검사
  { code: 'HA401', name: 'X-ray - Shoulder', nameKo: '어깨 X-ray', category: '영상', keywords: ['x-ray shldr', 'shldr x-ray', '어깨 엑스레이'] },
  { code: 'HA471', name: 'X-ray - Knee', nameKo: '무릎 X-ray', category: '영상', keywords: ['x-ray knee', 'knee x-ray', '무릎 엑스레이'] },
  { code: 'HA481', name: 'X-ray - L-spine', nameKo: '요추 X-ray', category: '영상', keywords: ['x-ray l-spine', 'l-spine x-ray', '허리 엑스레이'] },
  { code: 'HE101', name: 'MRI - Shoulder', nameKo: '어깨 MRI', category: '영상', keywords: ['mri shldr', 'shoulder mri', '어깨 mri'] },
  { code: 'HE141', name: 'MRI - Knee', nameKo: '무릎 MRI', category: '영상', keywords: ['mri knee', 'knee mri', '무릎 mri'] },
  { code: 'HE151', name: 'MRI - L-spine', nameKo: '요추 MRI', category: '영상', keywords: ['mri l-spine', 'l-spine mri', '허리 mri', 'lumbar mri'] },
  { code: 'HE111', name: 'MRI - C-spine', nameKo: '경추 MRI', category: '영상', keywords: ['mri c-spine', 'c-spine mri', '목 mri', 'cervical mri'] },
  { code: 'HE161', name: 'MRI - Elbow', nameKo: '팔꿈치 MRI', category: '영상', keywords: ['mri elbow', 'elbow mri', '팔꿈치 mri'] },
  { code: 'HD401', name: 'Ultrasound - MSK', nameKo: '근골격 초음파', category: '영상', keywords: ['msk us', '근골격초음파', 'musculoskeletal ultrasound'] },
  { code: 'HZ271', name: 'Bone Density (DEXA)', nameKo: '골밀도검사(DEXA)', category: '검사', keywords: ['dexa', 'bone density', '골밀도', '골다공증 검사'] },

  // 처치
  { code: 'N0031', name: 'Cast Application', nameKo: '석고붕대(캐스트)', category: '처치', keywords: ['cast', '석고', '캐스트', '고정'] },
  { code: 'N0061', name: 'Splint Application', nameKo: '부목 고정', category: '처치', keywords: ['splint', '부목', '고정'] },
  { code: 'N0091', name: 'Elastic Bandage', nameKo: '탄력붕대', category: '처치', keywords: ['elastic bandage', '탄력붕대', '압박붕대'] },
  { code: 'R4511', name: 'Suture - Simple', nameKo: '단순봉합', category: '처치', keywords: ['suture', '봉합', 'stitch'] },
]

// === 매칭 로직 ===

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9가-힣\s\/\-]/g, ' ').trim()
}

function matchScore(text: string, keywords: string[]): number {
  const normalized = normalizeText(text)
  let score = 0
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword)
    if (normalized.includes(normalizedKeyword)) {
      // 더 긴 키워드 매치에 더 높은 점수
      score += normalizedKeyword.length
    }
  }
  return score
}

export function matchKCDCodes(diagnoses: string[]): KCDCode[] {
  const combined = diagnoses.join(' ')
  const scored = KCD_CODES
    .map(code => ({ code, score: matchScore(combined, code.keywords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  // 상위 5개, 중복 방지
  const seen = new Set<string>()
  const results: KCDCode[] = []
  for (const { code } of scored) {
    if (!seen.has(code.code)) {
      seen.add(code.code)
      results.push(code)
      if (results.length >= 5) break
    }
  }
  return results
}

export function matchEDICodes(plans: string[]): EDICode[] {
  const combined = plans.join(' ')
  const scored = EDI_CODES
    .map(code => ({ code, score: matchScore(combined, code.keywords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const results: EDICode[] = []
  for (const { code } of scored) {
    if (!seen.has(code.code)) {
      seen.add(code.code)
      results.push(code)
      if (results.length >= 8) break
    }
  }
  return results
}

export function matchInsuranceCodes(diagnoses: string[], plans: string[]): InsuranceCodeMatch {
  return {
    kcd: matchKCDCodes(diagnoses),
    edi: matchEDICodes(plans),
  }
}
