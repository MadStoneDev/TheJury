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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ab_experiments: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          poll_id: string
          traffic_split: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          poll_id: string
          traffic_split?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          poll_id?: string
          traffic_split?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_experiments_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_types: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_repeatable: boolean | null
          name: string
          points: number | null
          target_value: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_repeatable?: boolean | null
          name: string
          points?: number | null
          target_value?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_repeatable?: boolean | null
          name?: string
          points?: number | null
          target_value?: number | null
        }
        Relationships: []
      }
      demo_polls: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: []
      }
      demo_votes: {
        Row: {
          demo_poll_id: string
          id: string
          selected_options: Json
          voted_at: string | null
          voter_fingerprint: string
        }
        Insert: {
          demo_poll_id: string
          id?: string
          selected_options: Json
          voted_at?: string | null
          voter_fingerprint: string
        }
        Update: {
          demo_poll_id?: string
          id?: string
          selected_options?: Json
          voted_at?: string | null
          voter_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_votes_demo_poll_id_fkey"
            columns: ["demo_poll_id"]
            isOneToOne: false
            referencedRelation: "demo_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_embeds: {
        Row: {
          domain: string
          embed_type: string | null
          first_seen: string | null
          id: string
          last_seen: string | null
          poll_id: string
          total_views: number | null
          total_votes: number | null
        }
        Insert: {
          domain: string
          embed_type?: string | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          poll_id: string
          total_views?: number | null
          total_votes?: number | null
        }
        Update: {
          domain?: string
          embed_type?: string | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          poll_id?: string
          total_views?: number | null
          total_votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_embeds_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          option_order: number
          poll_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_order: number
          poll_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_order?: number
          poll_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_variants: {
        Row: {
          created_at: string | null
          description: string | null
          experiment_id: string
          id: string
          question: string
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          experiment_id: string
          id?: string
          question: string
          variant_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          experiment_id?: string
          id?: string
          question?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean | null
          allow_vote_editing: boolean | null
          code: string
          created_at: string | null
          description: string | null
          embed_enabled: boolean | null
          embed_settings: Json | null
          end_date: string | null
          has_time_limit: boolean | null
          id: string
          is_active: boolean | null
          question: string
          show_results_to_voters: boolean | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_multiple?: boolean | null
          allow_vote_editing?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          embed_enabled?: boolean | null
          embed_settings?: Json | null
          end_date?: string | null
          has_time_limit?: boolean | null
          id?: string
          is_active?: boolean | null
          question: string
          show_results_to_voters?: boolean | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_multiple?: boolean | null
          allow_vote_editing?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          embed_enabled?: boolean | null
          embed_settings?: Json | null
          end_date?: string | null
          has_time_limit?: boolean | null
          id?: string
          is_active?: boolean | null
          question?: string
          show_results_to_voters?: boolean | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          tier: number | null
          user_id: string
        }
        Insert: {
          achievement_type_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          tier?: number | null
          user_id: string
        }
        Update: {
          achievement_type_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          tier?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_type_id_fkey"
            columns: ["achievement_type_id"]
            isOneToOne: false
            referencedRelation: "achievement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_preferences: {
        Row: {
          achievement_notifications: boolean | null
          created_at: string | null
          new_votes: boolean | null
          poll_milestones: boolean | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          achievement_notifications?: boolean | null
          created_at?: string | null
          new_votes?: boolean | null
          poll_milestones?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          achievement_notifications?: boolean | null
          created_at?: string | null
          new_votes?: boolean | null
          poll_milestones?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          consecutive_days: number | null
          last_activity_date: string | null
          level: number | null
          polls_created: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          votes_cast: number | null
          votes_received: number | null
        }
        Insert: {
          consecutive_days?: number | null
          last_activity_date?: string | null
          level?: number | null
          polls_created?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          votes_cast?: number | null
          votes_received?: number | null
        }
        Update: {
          consecutive_days?: number | null
          last_activity_date?: string | null
          level?: number | null
          polls_created?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          votes_cast?: number | null
          votes_received?: number | null
        }
        Relationships: []
      }
      user_variant_assignments: {
        Row: {
          assigned_at: string | null
          experiment_id: string
          id: string
          user_id: string | null
          variant_id: string
          voted: boolean | null
          voted_at: string | null
          voter_fingerprint: string | null
        }
        Insert: {
          assigned_at?: string | null
          experiment_id: string
          id?: string
          user_id?: string | null
          variant_id: string
          voted?: boolean | null
          voted_at?: string | null
          voter_fingerprint?: string | null
        }
        Update: {
          assigned_at?: string | null
          experiment_id?: string
          id?: string
          user_id?: string | null
          variant_id?: string
          voted?: boolean | null
          voted_at?: string | null
          voter_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_variant_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_variant_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "poll_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_edits: {
        Row: {
          edited_at: string | null
          id: string
          new_options: Json
          original_vote_id: string
          previous_options: Json
          user_id: string | null
          voter_fingerprint: string | null
          voter_ip: string | null
        }
        Insert: {
          edited_at?: string | null
          id?: string
          new_options: Json
          original_vote_id: string
          previous_options: Json
          user_id?: string | null
          voter_fingerprint?: string | null
          voter_ip?: string | null
        }
        Update: {
          edited_at?: string | null
          id?: string
          new_options?: Json
          original_vote_id?: string
          previous_options?: Json
          user_id?: string | null
          voter_fingerprint?: string | null
          voter_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vote_edits_original_vote_id_fkey"
            columns: ["original_vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          options: Json | null
          poll_id: string
          user_id: string | null
          voter_fingerprint: string | null
          voter_ip: unknown | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          options?: Json | null
          poll_id: string
          user_id?: string | null
          voter_fingerprint?: string | null
          voter_ip?: unknown | null
        }
        Update: {
          created_at?: string | null
          id?: string
          options?: Json | null
          poll_id?: string
          user_id?: string | null
          voter_fingerprint?: string | null
          voter_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_variant: {
        Args: {
          experiment_uuid: string
          fingerprint?: string
          user_uuid?: string
        }
        Returns: string
      }
      generate_unique_username: {
        Args: { base_name?: string }
        Returns: string
      }
      get_demo_poll_results: {
        Args: { poll_uuid: string }
        Returns: {
          option_id: string
          option_text: string
          vote_count: number
        }[]
      }
      get_poll_results: {
        Args: { poll_uuid: string }
        Returns: {
          option_id: string
          option_order: number
          option_text: string
          vote_count: number
        }[]
      }
      get_random_demo_poll: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          description: string
          id: string
          options: Json
          question: string
        }[]
      }
      poll_code_exists: {
        Args: { poll_code: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
