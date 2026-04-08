export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          user_id: string
          title: string
          hospital_name: string | null
          body_part: string | null
          consultation_date: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          hospital_name?: string | null
          body_part?: string | null
          consultation_date?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          hospital_name?: string | null
          body_part?: string | null
          consultation_date?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          consultation_id: string
          audio_url: string | null
          raw_text: string
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          audio_url?: string | null
          raw_text: string
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          audio_url?: string | null
          raw_text?: string
          duration_seconds?: number | null
          created_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          consultation_id: string
          soap_subjective: string | null
          soap_objective: string | null
          soap_assessment: string | null
          soap_plan: string | null
          keywords: string[]
          abbreviations: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          soap_subjective?: string | null
          soap_objective?: string | null
          soap_assessment?: string | null
          soap_plan?: string | null
          keywords?: string[]
          abbreviations?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          soap_subjective?: string | null
          soap_objective?: string | null
          soap_assessment?: string | null
          soap_plan?: string | null
          keywords?: string[]
          abbreviations?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      consultation_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
}

// 편의 타입들
export type User = Database['public']['Tables']['users']['Row']
export type Consultation = Database['public']['Tables']['consultations']['Row']
export type Transcript = Database['public']['Tables']['transcripts']['Row']
export type Summary = Database['public']['Tables']['summaries']['Row']

export type ConsultationStatus = Database['public']['Tables']['consultations']['Row']['status']

// 초진/재진 타입
export type ConsultationType = 'initial' | 'follow_up'

// 구조화된 차트 (초진/재진 통합)
export interface ChartStructured {
  cc: string
  pi: string
  diagnosis: string[]
  plan: string[]
  // 초진 전용 필드
  phx?: string          // Past History (과거 병력)
  pex?: string          // Physical Examination (이학적 검사)
  // 재진 전용 필드
  progress?: string     // 경과 한줄 ("많이 좋아졌다")
}

// 추가 정보 (PMH, 수술력, 약물, 알러지)
export interface AdditionalInfo {
  pmh: string
  surgical_history: string
  medication: string
  allergy: string
}

// 상담사용 요약
export interface CounselorSummary {
  explanation: string
  treatment_reason: string
  treatment_items: string[]
}

// AI 응답 전체 구조
export interface ChartResponse {
  chart: ChartStructured
  note: string
  keywords: string[]
  consultation_type: ConsultationType
  counselor_summary: CounselorSummary
}

// 차트 포맷 설정 - 각 필드별 설정
export interface ChartFieldConfig {
  key: string           // 고유 키 (cc, pi, dx, plan, note 또는 커스텀)
  label: string         // 표시 라벨 (예: "Chief Complaint")
  badge: string         // 뱃지 텍스트 (예: "CC")
  badgeColor: string    // 뱃지 색상 클래스
  enabled: boolean      // 표시 여부
  promptHint: string    // AI에게 전달할 커스텀 지시사항 (예: "영문 약어 위주로 작성")
  isCustom?: boolean    // 사용자가 추가한 커스텀 필드 여부
  type: 'text' | 'list' // 텍스트 or 배열 타입
}

// 전체 차트 포맷 설정
export interface ChartFormatConfig {
  fields: ChartFieldConfig[]
  globalPrompt: string  // 전체 차트에 대한 추가 지시사항
}

// 기본 차트 포맷 설정
export const DEFAULT_CHART_FORMAT: ChartFormatConfig = {
  fields: [
    { key: 'cc', label: 'Chief Complaint', badge: 'CC', badgeColor: 'bg-blue-100 text-blue-700', enabled: true, promptHint: '', type: 'text' },
    { key: 'pi', label: 'Present Illness', badge: 'PI', badgeColor: 'bg-green-100 text-green-700', enabled: true, promptHint: '', type: 'text' },
    { key: 'dx', label: 'Diagnosis', badge: 'Dx', badgeColor: 'bg-amber-100 text-amber-700', enabled: true, promptHint: '', type: 'list' },
    { key: 'plan', label: 'Plan', badge: 'P', badgeColor: 'bg-purple-100 text-purple-700', enabled: true, promptHint: '', type: 'list' },
    { key: 'note', label: 'Note', badge: 'N', badgeColor: 'bg-gray-200 text-gray-600', enabled: true, promptHint: '', type: 'text' },
  ],
  globalPrompt: '',
}

// 확장된 차트 기록
export interface ExtendedChartRecord {
  id: string
  transcript: string
  chart: string
  chart_structured: ChartStructured | null
  note: string | null
  keywords: string[]
  consultation_type: ConsultationType
  additional_info: AdditionalInfo | null
  counselor_summary: CounselorSummary | null
  created_at: string
}
