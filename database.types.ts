export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.12"
  }
  public: {
    Tables: {
      ab_experiments: {
        Row: {
          id: string
          poll_id: string
          name: string
          is_active: boolean | null
          traffic_split: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          name: string
          is_active?: boolean | null
          traffic_split?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          name?: string
          is_active?: boolean | null
          traffic_split?: number | null
          created_at?: string | null
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
          id: string
          name: string
          description: string
          icon: string
          category: string
          target_value: number | null
          is_repeatable: boolean | null
          points: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          category: string
          target_value?: number | null
          is_repeatable?: boolean | null
          points?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: string
          target_value?: number | null
          is_repeatable?: boolean | null
          points?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      ai_poll_usage: {
        Row: {
          id: string
          user_id: string
          month_year: string
          usage_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          usage_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          usage_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_poll_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[]
          last_used_at: string | null
          expires_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes?: string[]
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          scopes?: string[]
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          id: string
          user_id: string
          domain: string
          verification_token: string
          verified: boolean | null
          verified_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          domain: string
          verification_token: string
          verified?: boolean | null
          verified_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          domain?: string
          verification_token?: string
          verified?: boolean | null
          verified_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_polls: {
        Row: {
          id: string
          question: string
          description: string | null
          options: Json
          category: string | null
          is_active: boolean | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question: string
          description?: string | null
          options: Json
          category?: string | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          question?: string
          description?: string | null
          options?: Json
          category?: string | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      demo_votes: {
        Row: {
          id: string
          demo_poll_id: string
          selected_options: Json
          voter_fingerprint: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          demo_poll_id: string
          selected_options: Json
          voter_fingerprint: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          demo_poll_id?: string
          selected_options?: Json
          voter_fingerprint?: string
          voted_at?: string | null
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
      discord_link_codes: {
        Row: {
          code: string
          guild_id: string
          guild_name: string | null
          created_at: string | null
          expires_at: string
          claimed: boolean
        }
        Insert: {
          code: string
          guild_id: string
          guild_name?: string | null
          created_at?: string | null
          expires_at: string
          claimed?: boolean
        }
        Update: {
          code?: string
          guild_id?: string
          guild_name?: string | null
          created_at?: string | null
          expires_at?: string
          claimed?: boolean
        }
        Relationships: []
      }
      discord_links: {
        Row: {
          guild_id: string
          guild_name: string | null
          user_id: string
          created_at: string | null
        }
        Insert: {
          guild_id: string
          guild_name?: string | null
          user_id: string
          created_at?: string | null
        }
        Update: {
          guild_id?: string
          guild_name?: string | null
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discord_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_poll_messages: {
        Row: {
          id: string
          poll_id: string
          guild_id: string
          channel_id: string
          message_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          guild_id: string
          channel_id: string
          message_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          guild_id?: string
          channel_id?: string
          message_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discord_poll_messages_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_embeds: {
        Row: {
          id: string
          poll_id: string
          domain: string
          embed_type: string | null
          first_seen: string | null
          last_seen: string | null
          total_views: number | null
          total_votes: number | null
        }
        Insert: {
          id?: string
          poll_id: string
          domain: string
          embed_type?: string | null
          first_seen?: string | null
          last_seen?: string | null
          total_views?: number | null
          total_votes?: number | null
        }
        Update: {
          id?: string
          poll_id?: string
          domain?: string
          embed_type?: string | null
          first_seen?: string | null
          last_seen?: string | null
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
          id: string
          poll_id: string
          text: string
          option_order: number
          created_at: string | null
          question_id: string | null
          image_url: string | null
          is_correct: boolean | null
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          option_order: number
          created_at?: string | null
          question_id?: string | null
          image_url?: string | null
          is_correct?: boolean | null
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          option_order?: number
          created_at?: string | null
          question_id?: string | null
          image_url?: string | null
          is_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_questions: {
        Row: {
          id: string
          poll_id: string
          question_text: string
          question_type: string
          question_order: number
          allow_multiple: boolean | null
          settings: Json | null
          created_at: string | null
          time_limit_seconds: number | null
        }
        Insert: {
          id?: string
          poll_id: string
          question_text: string
          question_type?: string
          question_order?: number
          allow_multiple?: boolean | null
          settings?: Json | null
          created_at?: string | null
          time_limit_seconds?: number | null
        }
        Update: {
          id?: string
          poll_id?: string
          question_text?: string
          question_type?: string
          question_order?: number
          allow_multiple?: boolean | null
          settings?: Json | null
          created_at?: string | null
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_questions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          id: string
          poll_id: string
          question_id: string
          user_id: string | null
          voter_fingerprint: string | null
          response_text: string
          created_at: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          question_id: string
          user_id?: string | null
          voter_fingerprint?: string | null
          response_text: string
          created_at?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          question_id?: string
          user_id?: string | null
          voter_fingerprint?: string | null
          response_text?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_variants: {
        Row: {
          id: string
          experiment_id: string
          name: string
          question_text: string
          description: string | null
          created_at: string | null
          weight: number
        }
        Insert: {
          id?: string
          experiment_id: string
          name: string
          question_text: string
          description?: string | null
          created_at?: string | null
          weight?: number
        }
        Update: {
          id?: string
          experiment_id?: string
          name?: string
          question_text?: string
          description?: string | null
          created_at?: string | null
          weight?: number
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
          id: string
          code: string
          user_id: string
          question: string
          description: string | null
          allow_multiple: boolean | null
          is_active: boolean | null
          has_time_limit: boolean | null
          start_date: string | null
          end_date: string | null
          created_at: string | null
          updated_at: string | null
          allow_vote_editing: boolean | null
          show_results_to_voters: boolean | null
          embed_enabled: boolean | null
          embed_settings: Json | null
          password_hash: string | null
          live_mode: boolean | null
          live_state: string | null
          live_current_question: number | null
          team_id: string | null
          quiz_mode: boolean | null
        }
        Insert: {
          id?: string
          code: string
          user_id: string
          question: string
          description?: string | null
          allow_multiple?: boolean | null
          is_active?: boolean | null
          has_time_limit?: boolean | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          allow_vote_editing?: boolean | null
          show_results_to_voters?: boolean | null
          embed_enabled?: boolean | null
          embed_settings?: Json | null
          password_hash?: string | null
          live_mode?: boolean | null
          live_state?: string | null
          live_current_question?: number | null
          team_id?: string | null
          quiz_mode?: boolean | null
        }
        Update: {
          id?: string
          code?: string
          user_id?: string
          question?: string
          description?: string | null
          allow_multiple?: boolean | null
          is_active?: boolean | null
          has_time_limit?: boolean | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          allow_vote_editing?: boolean | null
          show_results_to_voters?: boolean | null
          embed_enabled?: boolean | null
          embed_settings?: Json | null
          password_hash?: string | null
          live_mode?: boolean | null
          live_state?: string | null
          live_current_question?: number | null
          team_id?: string | null
          quiz_mode?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
          brand_logo_url: string | null
          stripe_customer_id: string | null
          subscription_tier: string
          subscription_status: string | null
          subscription_id: string | null
          current_period_end: string | null
          role: number
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          brand_logo_url?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string
          subscription_status?: string | null
          subscription_id?: string | null
          current_period_end?: string | null
          role?: number
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          brand_logo_url?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string
          subscription_status?: string | null
          subscription_id?: string | null
          current_period_end?: string | null
          role?: number
        }
        Relationships: []
      }
      quiz_participants: {
        Row: {
          id: string
          poll_id: string
          user_id: string | null
          voter_fingerprint: string | null
          nickname: string
          score: number
          correct_count: number
          created_at: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          user_id?: string | null
          voter_fingerprint?: string | null
          nickname: string
          score?: number
          correct_count?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string | null
          voter_fingerprint?: string | null
          nickname?: string
          score?: number
          correct_count?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_participants_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          sort_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          sort_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          sort_order?: number
          created_at?: string | null
        }
        Relationships: []
      }
      roadmap_suggestions: {
        Row: {
          id: string
          user_id: string
          body: string
          is_read: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          body: string
          is_read?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          body?: string
          is_read?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_votes: {
        Row: {
          id: string
          item_id: string
          voter_key: string
          created_at: string | null
        }
        Insert: {
          id?: string
          item_id: string
          voter_key: string
          created_at?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          voter_key?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          received_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          invited_email: string | null
          invite_status: string
          invited_at: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          invited_email?: string | null
          invite_status?: string
          invited_at?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          invited_email?: string | null
          invite_status?: string
          invited_at?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type_id: string
          progress: number | null
          completed_at: string | null
          tier: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type_id: string
          progress?: number | null
          completed_at?: string | null
          tier?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type_id?: string
          progress?: number | null
          completed_at?: string | null
          tier?: number | null
          created_at?: string | null
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
          user_id: string
          weekly_summary: boolean | null
          poll_milestones: boolean | null
          new_votes: boolean | null
          achievement_notifications: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          weekly_summary?: boolean | null
          poll_milestones?: boolean | null
          new_votes?: boolean | null
          achievement_notifications?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          weekly_summary?: boolean | null
          poll_milestones?: boolean | null
          new_votes?: boolean | null
          achievement_notifications?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          user_id: string
          polls_created: number | null
          votes_received: number | null
          votes_cast: number | null
          consecutive_days: number | null
          total_points: number | null
          level: number | null
          last_activity_date: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          polls_created?: number | null
          votes_received?: number | null
          votes_cast?: number | null
          consecutive_days?: number | null
          total_points?: number | null
          level?: number | null
          last_activity_date?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          polls_created?: number | null
          votes_received?: number | null
          votes_cast?: number | null
          consecutive_days?: number | null
          total_points?: number | null
          level?: number | null
          last_activity_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_variant_assignments: {
        Row: {
          id: string
          experiment_id: string
          user_id: string | null
          voter_fingerprint: string | null
          variant_id: string
          assigned_at: string | null
          voted: boolean | null
          voted_at: string | null
        }
        Insert: {
          id?: string
          experiment_id: string
          user_id?: string | null
          voter_fingerprint?: string | null
          variant_id: string
          assigned_at?: string | null
          voted?: boolean | null
          voted_at?: string | null
        }
        Update: {
          id?: string
          experiment_id?: string
          user_id?: string | null
          voter_fingerprint?: string | null
          variant_id?: string
          assigned_at?: string | null
          voted?: boolean | null
          voted_at?: string | null
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
          id: string
          original_vote_id: string
          previous_options: Json
          new_options: Json
          edited_at: string | null
          user_id: string | null
          voter_ip: string | null
          voter_fingerprint: string | null
        }
        Insert: {
          id?: string
          original_vote_id: string
          previous_options: Json
          new_options: Json
          edited_at?: string | null
          user_id?: string | null
          voter_ip?: string | null
          voter_fingerprint?: string | null
        }
        Update: {
          id?: string
          original_vote_id?: string
          previous_options?: Json
          new_options?: Json
          edited_at?: string | null
          user_id?: string | null
          voter_ip?: string | null
          voter_fingerprint?: string | null
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
          id: string
          poll_id: string
          user_id: string | null
          voter_ip: string | null
          voter_fingerprint: string | null
          created_at: string | null
          options: Json | null
          answers: Json | null
        }
        Insert: {
          id?: string
          poll_id: string
          user_id?: string | null
          voter_ip?: string | null
          voter_fingerprint?: string | null
          created_at?: string | null
          options?: Json | null
          answers?: Json | null
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string | null
          voter_ip?: string | null
          voter_fingerprint?: string | null
          created_at?: string | null
          options?: Json | null
          answers?: Json | null
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
      webhooks: {
        Row: {
          id: string
          user_id: string
          team_id: string | null
          url: string
          events: string[]
          secret: string
          is_active: boolean | null
          last_triggered_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          team_id?: string | null
          url: string
          events?: string[]
          secret: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string | null
          url?: string
          events?: string[]
          secret?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string | null
          username: string | null
          avatar_url: string | null
          subscription_tier: string | null
          brand_logo_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_variant: {
        Args: {
          experiment_uuid: string
          user_uuid: string
          fingerprint: string
        }
        Returns: string
      }
      generate_unique_username: {
        Args: {
          base_name: string
        }
        Returns: string
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
