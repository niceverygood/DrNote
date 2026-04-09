-- 병원(조직) 관리
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                              -- 병원명
  hospital_type TEXT NOT NULL DEFAULT 'outpatient', -- outpatient | inpatient | both
  owner_user_id UUID NOT NULL,                     -- 대표 (최초 생성자)
  -- 구독 (개발 중 전체 해제)
  subscription_tier TEXT DEFAULT 'dev',             -- dev | free | basic | pro | enterprise
  subscription_until TIMESTAMPTZ,
  max_members INTEGER DEFAULT 999,                 -- dev: 무제한
  max_charts_per_month INTEGER DEFAULT 999999,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 직원(멤버)
CREATE TABLE IF NOT EXISTS org_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID,                                    -- 카카오 로그인 후 연결
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'doctor',              -- doctor | nurse | counselor | admin
  invite_code TEXT UNIQUE,                         -- 6자리 초대 코드
  status TEXT DEFAULT 'pending',                   -- pending(초대) | active | disabled
  invited_by UUID,                                 -- 초대한 사람 user_id
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용량 추적
CREATE TABLE IF NOT EXISTS org_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  month TEXT NOT NULL,                             -- YYYY-MM
  chart_count INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  note_count INTEGER DEFAULT 0,
  UNIQUE(org_id, month)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_code ON org_members(invite_code);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);

-- user_profiles에 org 연결 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS org_role TEXT DEFAULT 'member';
