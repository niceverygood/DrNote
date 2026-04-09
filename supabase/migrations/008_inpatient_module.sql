-- 입원 환자 관리

CREATE TABLE IF NOT EXISTS inpatients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,                -- M / F
  room_number TEXT,                   -- 병실 호수
  bed_number TEXT,                    -- 침대 번호
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  discharge_date DATE,
  attending_doctor TEXT,              -- 주치의
  department TEXT DEFAULT '정형외과',
  admission_diagnosis TEXT,           -- 입원 진단
  status TEXT DEFAULT 'admitted',     -- admitted | discharged | transferred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 입원 기록 (입원초기평가, 경과기록, 수술기록, 퇴원요약)
CREATE TABLE IF NOT EXISTS inpatient_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inpatient_id UUID NOT NULL REFERENCES inpatients(id),
  note_type TEXT NOT NULL,            -- admission | progress | operative | discharge
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content JSONB NOT NULL DEFAULT '{}',
  transcript TEXT,                    -- 녹음 원문
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inpatients_status ON inpatients(status);
CREATE INDEX IF NOT EXISTS idx_inpatient_notes_patient ON inpatient_notes(inpatient_id);
CREATE INDEX IF NOT EXISTS idx_inpatient_notes_type ON inpatient_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_inpatient_notes_date ON inpatient_notes(note_date);

ALTER PUBLICATION supabase_realtime ADD TABLE inpatients;
ALTER PUBLICATION supabase_realtime ADD TABLE inpatient_notes;
