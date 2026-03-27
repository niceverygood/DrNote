-- Dr.Note 초기 스키마
-- Supabase SQL Editor에서 실행

-- 1. ENUM 타입 생성
CREATE TYPE consultation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 2. Users 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Consultations 테이블 (진료 기록)
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hospital_name TEXT,
  body_part TEXT,
  consultation_date DATE DEFAULT CURRENT_DATE,
  status consultation_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transcripts 테이블 (STT 원문)
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  audio_url TEXT,
  raw_text TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Summaries 테이블 (AI 요약)
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  soap_subjective TEXT,
  soap_objective TEXT,
  soap_assessment TEXT,
  soap_plan TEXT,
  keywords TEXT[] DEFAULT '{}',
  abbreviations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 인덱스 생성
CREATE INDEX idx_consultations_user_id ON consultations(user_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date DESC);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_transcripts_consultation_id ON transcripts(consultation_id);
CREATE INDEX idx_summaries_consultation_id ON summaries(consultation_id);

-- 7. Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 생성
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at
  BEFORE UPDATE ON summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- 10. RLS 정책 - Users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 11. RLS 정책 - Consultations
CREATE POLICY "Users can view own consultations"
  ON consultations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consultations"
  ON consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consultations"
  ON consultations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own consultations"
  ON consultations FOR DELETE
  USING (auth.uid() = user_id);

-- 12. RLS 정책 - Transcripts
CREATE POLICY "Users can view own transcripts"
  ON transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = transcripts.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcripts for own consultations"
  ON transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = transcripts.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

-- 13. RLS 정책 - Summaries
CREATE POLICY "Users can view own summaries"
  ON summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = summaries.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create summaries for own consultations"
  ON summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = summaries.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own summaries"
  ON summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = summaries.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

-- 14. Auth 트리거 - 새 사용자 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
