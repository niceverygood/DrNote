-- chart_records 테이블 확장 - 초진/재진, 추가정보, 상담사 요약
ALTER TABLE chart_records
  ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'initial',
  ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS counselor_summary JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chart_structured JSONB DEFAULT '{}';

-- consultation_type: 'initial' (초진) or 'follow_up' (재진)
-- additional_info: { pmh, surgical_history, medication, allergy }
-- counselor_summary: { explanation, treatment_reason, treatment_items }
-- chart_structured: { cc, pi, diagnosis[], plan[] }

COMMENT ON COLUMN chart_records.consultation_type IS '초진(initial) 또는 재진(follow_up)';
COMMENT ON COLUMN chart_records.additional_info IS 'PMH, 수술력, 약물, 알러지 등 추가 정보';
COMMENT ON COLUMN chart_records.counselor_summary IS '상담사용 요약 (설명, 치료이유, 치료항목)';
COMMENT ON COLUMN chart_records.chart_structured IS '구조화된 차트 (CC, PI, Dx, Plan)';

-- Realtime 활성화 (상담사 실시간 연동)
ALTER PUBLICATION supabase_realtime ADD TABLE chart_records;
