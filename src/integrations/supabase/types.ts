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
      attendance: {
        Row: {
          attend_date: string
          batch: string | null
          class_name: string | null
          created_at: string
          id: string
          marked_by: string | null
          status: string
          student_id: string
          subject: string | null
        }
        Insert: {
          attend_date?: string
          batch?: string | null
          class_name?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id: string
          subject?: string | null
        }
        Update: {
          attend_date?: string
          batch?: string | null
          class_name?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          class_name: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          icon: string | null
          id: string
          price: string | null
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          price?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          icon?: string | null
          id?: string
          price?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          batch: string | null
          class_name: string
          created_at: string
          exam_date: string | null
          id: string
          name: string
          subject: string | null
          syllabus: string | null
          total_marks: number
        }
        Insert: {
          batch?: string | null
          class_name: string
          created_at?: string
          exam_date?: string | null
          id?: string
          name: string
          subject?: string | null
          syllabus?: string | null
          total_marks?: number
        }
        Update: {
          batch?: string | null
          class_name?: string
          created_at?: string
          exam_date?: string | null
          id?: string
          name?: string
          subject?: string | null
          syllabus?: string | null
          total_marks?: number
        }
        Relationships: []
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          id: string
          month_label: string
          note: string | null
          paid: boolean
          paid_at: string | null
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month_label: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month_label?: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          batch: string | null
          class_name: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          subject: string | null
          title: string
        }
        Insert: {
          batch?: string | null
          class_name: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          subject?: string | null
          title: string
        }
        Update: {
          batch?: string | null
          class_name?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          batch: string | null
          class_name: string
          created_at: string
          description: string | null
          file_url: string
          id: string
          subject: string | null
          title: string
        }
        Insert: {
          batch?: string | null
          class_name: string
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          subject?: string | null
          title: string
        }
        Update: {
          batch?: string | null
          class_name?: string
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          body: string
          class_name: string | null
          created_at: string
          id: string
          important: boolean
          notice_date: string | null
          public_visible: boolean
          title: string
        }
        Insert: {
          body: string
          class_name?: string | null
          created_at?: string
          id?: string
          important?: boolean
          notice_date?: string | null
          public_visible?: boolean
          title: string
        }
        Update: {
          body?: string
          class_name?: string | null
          created_at?: string
          id?: string
          important?: boolean
          notice_date?: string | null
          public_visible?: boolean
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          address: string | null
          batch: string | null
          class_name: string | null
          created_at: string
          full_name: string
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          phone: string | null
          photo_url: string | null
          roll: string | null
          subject: string | null
          username: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          batch?: string | null
          class_name?: string | null
          created_at?: string
          full_name: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id: string
          phone?: string | null
          photo_url?: string | null
          roll?: string | null
          subject?: string | null
          username: string
        }
        Update: {
          active?: boolean
          address?: string | null
          batch?: string | null
          class_name?: string | null
          created_at?: string
          full_name?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          roll?: string | null
          subject?: string | null
          username?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          marks: number
          remarks: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          marks?: number
          remarks?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          marks?: number
          remarks?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          author_id: string | null
          comment: string
          created_at: string
          id: string
          rating: number
          student_name: string
        }
        Insert: {
          approved?: boolean
          author_id?: string | null
          comment: string
          created_at?: string
          id?: string
          rating?: number
          student_name: string
        }
        Update: {
          approved?: boolean
          author_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          student_name?: string
        }
        Relationships: []
      }
      routine: {
        Row: {
          batch: string | null
          class_name: string
          created_at: string
          day_name: string
          end_time: string
          id: string
          room: string | null
          sort_order: number
          start_time: string
          subject: string
          teacher_name: string | null
        }
        Insert: {
          batch?: string | null
          class_name: string
          created_at?: string
          day_name: string
          end_time: string
          id?: string
          room?: string | null
          sort_order?: number
          start_time: string
          subject: string
          teacher_name?: string | null
        }
        Update: {
          batch?: string | null
          class_name?: string
          created_at?: string
          day_name?: string
          end_time?: string
          id?: string
          room?: string | null
          sort_order?: number
          start_time?: string
          subject?: string
          teacher_name?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_text: string
          academy_name: string
          address: string | null
          ceo_name: string
          contact_email: string | null
          contact_phone: string | null
          facebook_url: string | null
          favicon_url: string | null
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          id: number
          logo_url: string | null
          primary_color: string
          show_courses: boolean
          show_notices: boolean
          show_reviews: boolean
          show_teachers: boolean
          updated_at: string
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          about_text?: string
          academy_name?: string
          address?: string | null
          ceo_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: number
          logo_url?: string | null
          primary_color?: string
          show_courses?: boolean
          show_notices?: boolean
          show_reviews?: boolean
          show_teachers?: boolean
          updated_at?: string
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_text?: string
          academy_name?: string
          address?: string | null
          ceo_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: number
          logo_url?: string | null
          primary_color?: string
          show_courses?: boolean
          show_notices?: boolean
          show_reviews?: boolean
          show_teachers?: boolean
          updated_at?: string
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          batch: string | null
          class_name: string
          created_at: string
          id: string
          subject: string | null
          teacher_id: string
        }
        Insert: {
          batch?: string | null
          class_name: string
          created_at?: string
          id?: string
          subject?: string | null
          teacher_id: string
        }
        Update: {
          batch?: string | null
          class_name?: string
          created_at?: string
          id?: string
          subject?: string | null
          teacher_id?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          sort_order: number
          subject: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          sort_order?: number
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          sort_order?: number
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          batch: string | null
          chapter: string | null
          class_date: string | null
          class_name: string
          created_at: string
          created_by: string | null
          id: string
          subject: string | null
          teacher_name: string | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          batch?: string | null
          chapter?: string | null
          class_date?: string | null
          class_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string | null
          teacher_name?: string | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          batch?: string | null
          chapter?: string | null
          class_date?: string | null
          class_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string | null
          teacher_name?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_teach: { Args: { _batch: string; _class: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      my_batch: { Args: never; Returns: string }
      my_class: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "super_admin" | "teacher" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["super_admin", "teacher", "student"],
    },
  },
} as const
