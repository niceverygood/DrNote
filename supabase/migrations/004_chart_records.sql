-- 차트 기록 테이블 (데모용 - 인증 불필요)
CREATE TABLE IF NOT EXISTS chart_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript TEXT NOT NULL,
  chart TEXT NOT NULL,
  note TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_chart_records_created_at ON chart_records(created_at DESC);

-- RLS 비활성화 (데모용)
ALTER TABLE chart_records DISABLE ROW LEVEL SECURITY;
