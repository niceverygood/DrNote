-- chart_records 테이블 확장 - 환자명, 보험코드, 처방 저장
ALTER TABLE chart_records
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS insurance_codes JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prescriptions JSONB DEFAULT '[]';

-- patient_name: 환자 이름 (선택)
-- insurance_codes: { kcd: [{code, name, nameKo}], edi: [{code, name, nameKo, category}] }
-- prescriptions: [{ name, nameKo, medications: [...] }]

COMMENT ON COLUMN chart_records.patient_name IS '환자 이름';
COMMENT ON COLUMN chart_records.insurance_codes IS '추천 보험 청구 코드 (KCD/EDI)';
COMMENT ON COLUMN chart_records.prescriptions IS '추천 처방 세트';

-- patient_name 인덱스 (타임라인 그룹핑용)
CREATE INDEX IF NOT EXISTS idx_chart_records_patient_name ON chart_records(patient_name);
