export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      exam_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean | null
          points_awarded: number | null
          question_id: string
          response: Json
          updated_at: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id: string
          response?: Json
          updated_at?: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number | null
          question_id?: string
          response?: Json
          updated_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          auto_scored: boolean
          created_at: string
          id: string
          max_score: number | null
          organization_id: string | null
          registration_id: string
          score: number | null
          started_at: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          auto_scored?: boolean
          created_at?: string
          id?: string
          max_score?: number | null
          organization_id?: string | null
          registration_id: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_scored?: boolean
          created_at?: string
          id?: string
          max_score?: number | null
          organization_id?: string | null
          registration_id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exam_registrations: {
        Row: {
          candidate_id: string
          created_at: string
          exam_id: string
          id: string
          identity_verified: boolean
          organization_id: string | null
          schedule_id: string | null
          score: number | null
          status: Database["public"]["Enums"]["registration_status"]
          system_check_passed: boolean
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          exam_id: string
          id?: string
          identity_verified?: boolean
          organization_id?: string | null
          schedule_id?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          system_check_passed?: boolean
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          exam_id?: string
          id?: string
          identity_verified?: boolean
          organization_id?: string | null
          schedule_id?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          system_check_passed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_registrations_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "exam_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          created_at: string
          created_by: string
          end_at: string
          exam_id: string
          id: string
          max_concurrent: number
          notify_confirmation: boolean
          notify_proctors: boolean
          notify_reminder: boolean
          organization_id: string | null
          start_at: string
          timezone: string
          updated_at: string
          waitlist_enabled: boolean
        }
        Insert: {
          created_at?: string
          created_by: string
          end_at: string
          exam_id: string
          id?: string
          max_concurrent?: number
          notify_confirmation?: boolean
          notify_proctors?: boolean
          notify_reminder?: boolean
          organization_id?: string | null
          start_at: string
          timezone?: string
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          end_at?: string
          exam_id?: string
          id?: string
          max_concurrent?: number
          notify_confirmation?: boolean
          notify_proctors?: boolean
          notify_reminder?: boolean
          organization_id?: string | null
          start_at?: string
          timezone?: string
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sections: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          position: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          position?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          position?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sections_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string | null
          status: Database["public"]["Enums"]["exam_status"]
          term: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          term?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          term?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          plan: string
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      proctoring_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message: string | null
          registration_id: string
          severity: Database["public"]["Enums"]["proctoring_severity"]
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          registration_id: string
          severity?: Database["public"]["Enums"]["proctoring_severity"]
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          registration_id?: string
          severity?: Database["public"]["Enums"]["proctoring_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_events_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "exam_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string
          id: string
          institution_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email: string
          id?: string
          institution_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string
          id?: string
          institution_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          created_by: string
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          id: string
          options: Json
          organization_id: string | null
          points: number
          position: number
          prompt: string
          section_id: string | null
          shuffle_options: boolean
          subject: string | null
          tags: string[]
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          id?: string
          options?: Json
          organization_id?: string | null
          points?: number
          position?: number
          prompt?: string
          section_id?: string | null
          shuffle_options?: boolean
          subject?: string | null
          tags?: string[]
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          id?: string
          options?: Json
          organization_id?: string | null
          points?: number
          position?: number
          prompt?: string
          section_id?: string | null
          shuffle_options?: boolean
          subject?: string | null
          tags?: string[]
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "exam_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_exam_questions_for_attempt: {
        Args: { _attempt_id: string }
        Returns: {
          q_difficulty: Database["public"]["Enums"]["question_difficulty"]
          q_id: string
          q_options: Json
          q_points: number
          q_position: number
          q_prompt: string
          q_section_id: string
          q_shuffle_options: boolean
          q_type: Database["public"]["Enums"]["question_type"]
        }[]
      }
      get_user_orgs: { Args: { _user_id?: string }; Returns: string[] }
      has_org_role: {
        Args: {
          _org_id: string
          _roles: Database["public"]["Enums"]["org_role"][]
          _user_id?: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id?: string }
        Returns: boolean
      }
      submit_exam_attempt: { Args: { _attempt_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "super_admin" | "institution" | "candidate" | "proctor"
      exam_status: "draft" | "published" | "archived"
      org_role: "owner" | "admin" | "instructor" | "proctor" | "member"
      proctoring_severity: "info" | "warning" | "high"
      question_difficulty: "easy" | "medium" | "hard"
      question_type: "mcq" | "descriptive" | "coding" | "true_false"
      registration_status:
        | "pending"
        | "confirmed"
        | "action_required"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "institution", "candidate", "proctor"],
      exam_status: ["draft", "published", "archived"],
      org_role: ["owner", "admin", "instructor", "proctor", "member"],
      proctoring_severity: ["info", "warning", "high"],
      question_difficulty: ["easy", "medium", "hard"],
      question_type: ["mcq", "descriptive", "coding", "true_false"],
      registration_status: [
        "pending",
        "confirmed",
        "action_required",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
