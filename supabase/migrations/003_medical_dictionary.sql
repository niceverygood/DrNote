-- 의학 용어 사전 테이블
CREATE TABLE IF NOT EXISTS medical_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abbreviation VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  korean_name VARCHAR(255),
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카테고리 인덱스
CREATE INDEX idx_medical_terms_category ON medical_terms(category);
CREATE INDEX idx_medical_terms_abbreviation ON medical_terms(abbreviation);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_terms_updated_at
  BEFORE UPDATE ON medical_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 정형외과 용어 삽입
INSERT INTO medical_terms (abbreviation, full_name, korean_name, category, description) VALUES
  -- 질환
  ('HNP', 'Herniated Nucleus Pulposus', '추간판 탈출증', 'disease', '디스크가 탈출하여 신경을 압박하는 상태'),
  ('DDD', 'Degenerative Disc Disease', '퇴행성 디스크 질환', 'disease', '디스크의 노화로 인한 퇴행성 변화'),
  ('OA', 'Osteoarthritis', '골관절염', 'disease', '관절 연골의 퇴행성 변화'),
  ('RA', 'Rheumatoid Arthritis', '류마티스 관절염', 'disease', '자가면역성 관절 질환'),
  ('Fx', 'Fracture', '골절', 'disease', '뼈가 부러진 상태'),

  -- 인대
  ('ACL', 'Anterior Cruciate Ligament', '전방십자인대', 'anatomy', '무릎 전방 안정성을 담당하는 인대'),
  ('PCL', 'Posterior Cruciate Ligament', '후방십자인대', 'anatomy', '무릎 후방 안정성을 담당하는 인대'),
  ('MCL', 'Medial Collateral Ligament', '내측측부인대', 'anatomy', '무릎 내측 안정성을 담당하는 인대'),
  ('LCL', 'Lateral Collateral Ligament', '외측측부인대', 'anatomy', '무릎 외측 안정성을 담당하는 인대'),

  -- 검사
  ('ROM', 'Range of Motion', '관절 가동 범위', 'examination', '관절이 움직일 수 있는 범위'),
  ('SLR', 'Straight Leg Raise test', '하지직거상 검사', 'examination', '좌골신경 압박 여부를 확인하는 검사'),
  ('McMurray', 'McMurray Test', '맥머레이 검사', 'examination', '반월판 손상을 확인하는 검사'),
  ('Lachman', 'Lachman Test', '라크만 검사', 'examination', 'ACL 손상을 확인하는 검사'),

  -- 수술/시술
  ('ORIF', 'Open Reduction Internal Fixation', '관혈적 정복 내고정술', 'procedure', '골절 부위를 절개하여 고정하는 수술'),
  ('TKA', 'Total Knee Arthroplasty', '슬관절 전치환술', 'procedure', '무릎 관절을 인공관절로 교체하는 수술'),
  ('THA', 'Total Hip Arthroplasty', '고관절 전치환술', 'procedure', '고관절을 인공관절로 교체하는 수술'),
  ('ACLR', 'ACL Reconstruction', '전방십자인대 재건술', 'procedure', '손상된 ACL을 재건하는 수술'),

  -- 치료
  ('PT', 'Physical Therapy', '물리치료', 'treatment', '운동과 물리적 방법을 이용한 재활 치료'),
  ('NSAIDs', 'Non-Steroidal Anti-Inflammatory Drugs', '비스테로이드성 소염제', 'treatment', '통증과 염증을 줄이는 약물'),
  ('PRP', 'Platelet-Rich Plasma', '자가혈소판풍부혈장', 'treatment', '자가 혈액에서 추출한 혈소판 농축액'),

  -- 영상검사
  ('MRI', 'Magnetic Resonance Imaging', '자기공명영상', 'imaging', '연부조직 및 구조물을 확인하는 검사'),
  ('CT', 'Computed Tomography', '컴퓨터단층촬영', 'imaging', '뼈 구조를 확인하는 검사'),
  ('BMD', 'Bone Mineral Density', '골밀도', 'imaging', '뼈의 밀도를 측정하는 검사'),
  ('X-ray', 'X-ray', '엑스레이', 'imaging', '뼈 구조를 확인하는 기본 검사'),

  -- 약어
  ('Lt.', 'Left', '좌측', 'abbreviation', '왼쪽'),
  ('Rt.', 'Right', '우측', 'abbreviation', '오른쪽'),
  ('Hx', 'History', '병력', 'abbreviation', '과거력/병력'),
  ('Dx', 'Diagnosis', '진단', 'abbreviation', '진단명'),
  ('Tx', 'Treatment', '치료', 'abbreviation', '치료'),
  ('Sx', 'Symptoms', '증상', 'abbreviation', '증상'),
  ('C/C', 'Chief Complaint', '주호소', 'abbreviation', '환자의 주된 호소'),
  ('R/O', 'Rule Out', '감별진단', 'abbreviation', '배제해야 할 진단'),
  ('F/U', 'Follow-up', '추적관찰', 'abbreviation', '재진/추적관찰'),
  ('PRN', 'Pro Re Nata', '필요시', 'abbreviation', '필요할 때'),
  ('bid', 'Bis In Die', '하루 2회', 'abbreviation', '하루에 두 번'),
  ('tid', 'Ter In Die', '하루 3회', 'abbreviation', '하루에 세 번'),
  ('qd', 'Quaque Die', '하루 1회', 'abbreviation', '하루에 한 번')
ON CONFLICT (abbreviation) DO NOTHING;

-- RLS 정책 (모든 사용자가 읽기 가능, 관리자만 수정 가능)
ALTER TABLE medical_terms ENABLE ROW LEVEL SECURITY;

-- 읽기는 모두 허용
CREATE POLICY "Anyone can read medical terms"
  ON medical_terms FOR SELECT
  USING (true);

-- 수정은 인증된 사용자만 (나중에 관리자 역할 추가 가능)
CREATE POLICY "Authenticated users can modify medical terms"
  ON medical_terms FOR ALL
  USING (auth.role() = 'authenticated');
