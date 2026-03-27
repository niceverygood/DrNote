// 기본 의학 용어 사전 (DB 연결 전 또는 폴백용)
export interface MedicalTerm {
  id: string
  abbreviation: string
  full_name: string
  korean_name: string | null
  category: string
  description: string | null
  is_active: boolean
}

export const DEFAULT_MEDICAL_TERMS: MedicalTerm[] = [
  // 질환
  { id: '1', abbreviation: 'HNP', full_name: 'Herniated Nucleus Pulposus', korean_name: '추간판 탈출증', category: 'disease', description: '디스크가 탈출하여 신경을 압박하는 상태', is_active: true },
  { id: '2', abbreviation: 'DDD', full_name: 'Degenerative Disc Disease', korean_name: '퇴행성 디스크 질환', category: 'disease', description: '디스크의 노화로 인한 퇴행성 변화', is_active: true },
  { id: '3', abbreviation: 'OA', full_name: 'Osteoarthritis', korean_name: '골관절염', category: 'disease', description: '관절 연골의 퇴행성 변화', is_active: true },
  { id: '4', abbreviation: 'RA', full_name: 'Rheumatoid Arthritis', korean_name: '류마티스 관절염', category: 'disease', description: '자가면역성 관절 질환', is_active: true },
  { id: '5', abbreviation: 'Fx', full_name: 'Fracture', korean_name: '골절', category: 'disease', description: '뼈가 부러진 상태', is_active: true },

  // 인대
  { id: '6', abbreviation: 'ACL', full_name: 'Anterior Cruciate Ligament', korean_name: '전방십자인대', category: 'anatomy', description: '무릎 전방 안정성을 담당하는 인대', is_active: true },
  { id: '7', abbreviation: 'PCL', full_name: 'Posterior Cruciate Ligament', korean_name: '후방십자인대', category: 'anatomy', description: '무릎 후방 안정성을 담당하는 인대', is_active: true },
  { id: '8', abbreviation: 'MCL', full_name: 'Medial Collateral Ligament', korean_name: '내측측부인대', category: 'anatomy', description: '무릎 내측 안정성을 담당하는 인대', is_active: true },
  { id: '9', abbreviation: 'LCL', full_name: 'Lateral Collateral Ligament', korean_name: '외측측부인대', category: 'anatomy', description: '무릎 외측 안정성을 담당하는 인대', is_active: true },

  // 검사
  { id: '10', abbreviation: 'ROM', full_name: 'Range of Motion', korean_name: '관절 가동 범위', category: 'examination', description: '관절이 움직일 수 있는 범위', is_active: true },
  { id: '11', abbreviation: 'SLR', full_name: 'Straight Leg Raise test', korean_name: '하지직거상 검사', category: 'examination', description: '좌골신경 압박 여부를 확인하는 검사', is_active: true },
  { id: '12', abbreviation: 'McMurray', full_name: 'McMurray Test', korean_name: '맥머레이 검사', category: 'examination', description: '반월판 손상을 확인하는 검사', is_active: true },
  { id: '13', abbreviation: 'Lachman', full_name: 'Lachman Test', korean_name: '라크만 검사', category: 'examination', description: 'ACL 손상을 확인하는 검사', is_active: true },

  // 수술/시술
  { id: '14', abbreviation: 'ORIF', full_name: 'Open Reduction Internal Fixation', korean_name: '관혈적 정복 내고정술', category: 'procedure', description: '골절 부위를 절개하여 고정하는 수술', is_active: true },
  { id: '15', abbreviation: 'TKA', full_name: 'Total Knee Arthroplasty', korean_name: '슬관절 전치환술', category: 'procedure', description: '무릎 관절을 인공관절로 교체하는 수술', is_active: true },
  { id: '16', abbreviation: 'THA', full_name: 'Total Hip Arthroplasty', korean_name: '고관절 전치환술', category: 'procedure', description: '고관절을 인공관절로 교체하는 수술', is_active: true },
  { id: '17', abbreviation: 'ACLR', full_name: 'ACL Reconstruction', korean_name: '전방십자인대 재건술', category: 'procedure', description: '손상된 ACL을 재건하는 수술', is_active: true },

  // 치료
  { id: '18', abbreviation: 'PT', full_name: 'Physical Therapy', korean_name: '물리치료', category: 'treatment', description: '운동과 물리적 방법을 이용한 재활 치료', is_active: true },
  { id: '19', abbreviation: 'NSAIDs', full_name: 'Non-Steroidal Anti-Inflammatory Drugs', korean_name: '비스테로이드성 소염제', category: 'treatment', description: '통증과 염증을 줄이는 약물', is_active: true },
  { id: '20', abbreviation: 'PRP', full_name: 'Platelet-Rich Plasma', korean_name: '자가혈소판풍부혈장', category: 'treatment', description: '자가 혈액에서 추출한 혈소판 농축액', is_active: true },

  // 영상검사
  { id: '21', abbreviation: 'MRI', full_name: 'Magnetic Resonance Imaging', korean_name: '자기공명영상', category: 'imaging', description: '연부조직 및 구조물을 확인하는 검사', is_active: true },
  { id: '22', abbreviation: 'CT', full_name: 'Computed Tomography', korean_name: '컴퓨터단층촬영', category: 'imaging', description: '뼈 구조를 확인하는 검사', is_active: true },
  { id: '23', abbreviation: 'BMD', full_name: 'Bone Mineral Density', korean_name: '골밀도', category: 'imaging', description: '뼈의 밀도를 측정하는 검사', is_active: true },
  { id: '24', abbreviation: 'X-ray', full_name: 'X-ray', korean_name: '엑스레이', category: 'imaging', description: '뼈 구조를 확인하는 기본 검사', is_active: true },

  // 약어
  { id: '25', abbreviation: 'Lt.', full_name: 'Left', korean_name: '좌측', category: 'abbreviation', description: '왼쪽', is_active: true },
  { id: '26', abbreviation: 'Rt.', full_name: 'Right', korean_name: '우측', category: 'abbreviation', description: '오른쪽', is_active: true },
  { id: '27', abbreviation: 'Hx', full_name: 'History', korean_name: '병력', category: 'abbreviation', description: '과거력/병력', is_active: true },
  { id: '28', abbreviation: 'Dx', full_name: 'Diagnosis', korean_name: '진단', category: 'abbreviation', description: '진단명', is_active: true },
  { id: '29', abbreviation: 'Tx', full_name: 'Treatment', korean_name: '치료', category: 'abbreviation', description: '치료', is_active: true },
  { id: '30', abbreviation: 'Sx', full_name: 'Symptoms', korean_name: '증상', category: 'abbreviation', description: '증상', is_active: true },
  { id: '31', abbreviation: 'C/C', full_name: 'Chief Complaint', korean_name: '주호소', category: 'abbreviation', description: '환자의 주된 호소', is_active: true },
  { id: '32', abbreviation: 'R/O', full_name: 'Rule Out', korean_name: '감별진단', category: 'abbreviation', description: '배제해야 할 진단', is_active: true },
  { id: '33', abbreviation: 'F/U', full_name: 'Follow-up', korean_name: '추적관찰', category: 'abbreviation', description: '재진/추적관찰', is_active: true },
  { id: '34', abbreviation: 'PRN', full_name: 'Pro Re Nata', korean_name: '필요시', category: 'abbreviation', description: '필요할 때', is_active: true },
  { id: '35', abbreviation: 'bid', full_name: 'Bis In Die', korean_name: '하루 2회', category: 'abbreviation', description: '하루에 두 번', is_active: true },
  { id: '36', abbreviation: 'tid', full_name: 'Ter In Die', korean_name: '하루 3회', category: 'abbreviation', description: '하루에 세 번', is_active: true },
  { id: '37', abbreviation: 'qd', full_name: 'Quaque Die', korean_name: '하루 1회', category: 'abbreviation', description: '하루에 한 번', is_active: true },

  // 추가 정형외과 약어
  { id: '38', abbreviation: 'LE', full_name: 'Lateral Epicondylitis', korean_name: '외측상과염 (테니스엘보)', category: 'disease', description: '팔꿈치 외측 통증', is_active: true },
  { id: '39', abbreviation: 'ME', full_name: 'Medial Epicondylitis', korean_name: '내측상과염 (골프엘보)', category: 'disease', description: '팔꿈치 내측 통증', is_active: true },
  { id: '40', abbreviation: 'RCS', full_name: 'Rotator Cuff Syndrome', korean_name: '회전근개 증후군', category: 'disease', description: '어깨 회전근개 손상', is_active: true },
  { id: '41', abbreviation: 'CFL', full_name: 'Calcaneofibular Ligament', korean_name: '종비인대', category: 'anatomy', description: '발목 외측 인대', is_active: true },
  { id: '42', abbreviation: 'ATFL', full_name: 'Anterior Talofibular Ligament', korean_name: '전거비인대', category: 'anatomy', description: '발목 전방 인대', is_active: true },
  { id: '43', abbreviation: 'ESWT', full_name: 'Extracorporeal Shockwave Therapy', korean_name: '체외충격파치료', category: 'treatment', description: '충격파로 조직 재생 촉진', is_active: true },
  { id: '44', abbreviation: 'ion', full_name: 'Iontophoresis', korean_name: '이온토포레시스', category: 'treatment', description: '전기를 이용한 약물 침투', is_active: true },
  { id: '45', abbreviation: 'inj', full_name: 'Injection', korean_name: '주사', category: 'treatment', description: '주사 치료', is_active: true },
  { id: '46', abbreviation: 'hlase', full_name: 'Hyaluronidase', korean_name: '히알루로니다제', category: 'treatment', description: '관절 주사제', is_active: true },
  { id: '47', abbreviation: 'manual E', full_name: 'Manual Exercise', korean_name: '도수운동', category: 'treatment', description: '도수치료 운동', is_active: true },
  { id: '48', abbreviation: 'shldr', full_name: 'Shoulder', korean_name: '어깨', category: 'abbreviation', description: '어깨', is_active: true },
  { id: '49', abbreviation: 'jt', full_name: 'Joint', korean_name: '관절', category: 'abbreviation', description: '관절', is_active: true },
  { id: '50', abbreviation: 'c', full_name: 'With', korean_name: '~와 함께', category: 'abbreviation', description: '~와 함께 (처방 시)', is_active: true },
  { id: '51', abbreviation: 'sprain', full_name: 'Sprain', korean_name: '염좌', category: 'disease', description: '인대 손상', is_active: true },
  { id: '52', abbreviation: 'PTfree', full_name: 'Physical Therapy (Free)', korean_name: '물리치료 (자유)', category: 'treatment', description: '자유 물리치료', is_active: true },
]

// 프롬프트용 사전 문자열 생성
export function buildDictionaryPrompt(terms: MedicalTerm[]): string {
  return terms
    .filter(t => t.is_active)
    .map(t => {
      const korean = t.korean_name ? ` (${t.korean_name})` : ''
      return `- ${t.abbreviation}: ${t.full_name}${korean}`
    })
    .join('\n')
}
