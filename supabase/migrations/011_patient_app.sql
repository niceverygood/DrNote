-- 환자 기록 (환자에게 공개되는 진료 내역)
CREATE TABLE IF NOT EXISTS patient_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_phone TEXT NOT NULL,
  patient_name TEXT,
  chart_record_id UUID,
  org_id UUID,
  hospital_name TEXT,
  doctor_name TEXT,
  visit_date DATE DEFAULT CURRENT_DATE,
  patient_summary TEXT,                    -- 환자용 쉬운 설명
  diagnosis_simple TEXT,                   -- 쉬운 진단명
  plan_simple TEXT,                        -- 쉬운 치료 계획
  education JSONB DEFAULT '{}',            -- 교육 자료
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 환자 문진표
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_phone TEXT NOT NULL,
  patient_name TEXT,
  visit_date DATE DEFAULT CURRENT_DATE,
  org_id UUID,
  content JSONB NOT NULL DEFAULT '{}',     -- 문진 내용
  status TEXT DEFAULT 'submitted',         -- submitted | reviewed
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 병원 가입 신청 (증명서 제출 → 관리자 승인)
CREATE TABLE IF NOT EXISTS hospital_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_type TEXT DEFAULT 'outpatient',
  phone TEXT,
  email TEXT,
  license_info TEXT,                       -- 사업자번호 등
  document_url TEXT,                       -- 증명서 파일 URL
  status TEXT DEFAULT 'pending',           -- pending | approved | rejected
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_records_phone ON patient_records(patient_phone);
CREATE INDEX IF NOT EXISTS idx_questionnaires_phone ON questionnaires(patient_phone);
CREATE INDEX IF NOT EXISTS idx_hospital_applications_status ON hospital_applications(status);
