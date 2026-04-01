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

// 구조화된 차트 (CC/PI/Dx/Plan)
export interface ChartStructured {
  cc: string
  pi: string
  diagnosis: string[]
  plan: string[]
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
