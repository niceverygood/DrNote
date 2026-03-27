-- Dr.Note Storage 설정
-- Supabase SQL Editor에서 실행

-- 1. Audio 파일 저장용 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  false,
  52428800, -- 50MB 제한
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/m4a']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS 정책
-- 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload own audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 사용자는 자신의 파일만 조회 가능
CREATE POLICY "Users can view own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 사용자는 자신의 파일만 삭제 가능
CREATE POLICY "Users can delete own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
