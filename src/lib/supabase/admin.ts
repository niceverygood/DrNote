import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service Role 클라이언트 - 서버에서만 사용
// RLS를 우회하여 관리자 작업 수행
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
