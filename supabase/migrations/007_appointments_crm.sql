-- 예약 CRM 시스템

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  department TEXT DEFAULT '정형외과',
  doctor_name TEXT,
  reason TEXT,                                    -- 예약 사유 (증상/치료)
  status TEXT DEFAULT 'pending',                  -- pending | confirmed | cancelled | completed
  source TEXT DEFAULT 'call',                     -- call | walk_in | online
  call_transcript TEXT,                           -- 통화 원문
  ai_extracted JSONB DEFAULT '{}',                -- AI가 추출한 예약 정보
  confirmed_by TEXT,                              -- 확인한 간호사 이름
  confirmed_at TIMESTAMPTZ,                       -- 확인 시각
  notes TEXT,                                     -- 간호사 메모
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_name);

COMMENT ON TABLE appointments IS '예약 관리 (CRM)';
COMMENT ON COLUMN appointments.status IS 'pending(대기) | confirmed(확정) | cancelled(취소) | completed(완료)';
COMMENT ON COLUMN appointments.source IS 'call(전화) | walk_in(방문) | online(온라인)';
COMMENT ON COLUMN appointments.ai_extracted IS 'AI가 통화에서 추출한 예약 정보 원본';

-- Realtime 활성화 (간호사 실시간 알림)
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
