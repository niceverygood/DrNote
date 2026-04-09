-- 사용자 프로필 (카카오 로그인 후 최초 설정)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,                    -- Supabase auth.users.id
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'doctor',              -- doctor | nurse | counselor
  hospital_name TEXT,
  hospital_type TEXT NOT NULL DEFAULT 'outpatient', -- outpatient | inpatient | both
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
