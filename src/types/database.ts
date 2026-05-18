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
      companies: {
        Row: {
          business_reg_no: string | null
          company_name: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          location: string | null
          manager: string | null
          mou_signed: boolean
          mou_signed_date: string | null
          phone: string | null
          representative: string | null
          updated_at: string
        }
        Insert: {
          business_reg_no?: string | null
          company_name: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          manager?: string | null
          mou_signed?: boolean
          mou_signed_date?: string | null
          phone?: string | null
          representative?: string | null
          updated_at?: string
        }
        Update: {
          business_reg_no?: string | null
          company_name?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          manager?: string | null
          mou_signed?: boolean
          mou_signed_date?: string | null
          phone?: string | null
          representative?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_courses: {
        Row: {
          company_id: string
          created_at: string
          id: string
          status: string
          sub_course_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          status?: string
          sub_course_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          status?: string
          sub_course_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_courses_sub_course_id_fkey"
            columns: ["sub_course_id"]
            isOneToOne: false
            referencedRelation: "sub_courses"
            referencedColumns: ["id"]
          }
        ]
      }
      company_mou_history: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          mou_type: string
          notes: string | null
          start_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          mou_type?: string
          notes?: string | null
          start_date: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          mou_type?: string
          notes?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_mou_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_mou_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      course_group_audiences: {
        Row: {
          audience_type: string
          created_at: string
          group_id: string
        }
        Insert: {
          audience_type: string
          created_at?: string
          group_id: string
        }
        Update: {
          audience_type?: string
          created_at?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_group_audiences_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "course_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      course_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          sent_count: number
          started_at: string | null
          status: string
          template_id: string | null
          total_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          sent_count?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          total_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          sent_count?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      email_logs: {
        Row: {
          attachments_meta: Json
          body_rendered: string | null
          created_at: string
          error_message: string | null
          id: string
          job_id: string | null
          participant_id: string | null
          recipient_email: string
          recipient_name: string | null
          sender_email: string | null
          sent_at: string
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          attachments_meta?: Json
          body_rendered?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          participant_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          sender_email?: string | null
          sent_at?: string
          status: string
          subject: string
          template_id?: string | null
        }
        Update: {
          attachments_meta?: Json
          body_rendered?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          participant_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sender_email?: string | null
          sent_at?: string
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "email_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      email_templates: {
        Row: {
          attachments: Json
          audience: string
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string
          updated_at: string
          variables: Json
        }
        Insert: {
          attachments?: Json
          audience: string
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          attachments?: Json
          audience?: string
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          application_date: string
          certificate_no: string | null
          completion_date: string | null
          created_at: string
          id: string
          is_retake: boolean
          participant_id: string
          retake_reason: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          application_date?: string
          certificate_no?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          is_retake?: boolean
          participant_id: string
          retake_reason?: string | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_date?: string
          certificate_no?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          is_retake?: boolean
          participant_id?: string
          retake_reason?: string | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sub_course_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      instructors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          document_skill: string | null
          email: string | null
          employment_insurance: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          updated_at: string
          work_experience: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          document_skill?: string | null
          email?: string | null
          employment_insurance?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          work_experience?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          document_skill?: string | null
          email?: string | null
          employment_insurance?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          work_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      session_instructors: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_instructors_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sub_course_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      sub_course_sessions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          session_no: number
          start_date: string
          status: string
          sub_course_id: string
          target_outcome: number
          total_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          session_no?: number
          start_date: string
          status?: string
          sub_course_id: string
          target_outcome?: number
          total_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          session_no?: number
          start_date?: string
          status?: string
          sub_course_id?: string
          target_outcome?: number
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_course_sessions_sub_course_id_fkey"
            columns: ["sub_course_id"]
            isOneToOne: false
            referencedRelation: "sub_courses"
            referencedColumns: ["id"]
          }
        ]
      }
      sub_courses: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          group_id: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          group_id: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          group_id?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_courses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "course_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      system_logs: {
        Row: {
          action_type: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          details: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          failed_login_count: number
          id: string
          last_login: string | null
          locked_until: string | null
          name: string | null
          password_hash: string | null
          role: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          failed_login_count?: number
          id?: string
          last_login?: string | null
          locked_until?: string | null
          name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          failed_login_count?: number
          id?: string
          last_login?: string | null
          locked_until?: string | null
          name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never