export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string
          user_id: string | null
          title: string
          slug: string
          content: string
          excerpt: string | null
          meta_description: string | null
          keywords: string[]
          tags: string[]
          category: string
          target_url: string
          anchor_text: string | null
          published_url: string | null
          status: string
          is_trial_post: boolean
          claimed: boolean
          expires_at: string | null
          view_count: number
          seo_score: number
          reading_time: number
          word_count: number
          featured_image: string | null
          author_name: string
          author_avatar: string | null
          contextual_links: Json
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          slug: string
          content: string
          excerpt?: string | null
          meta_description?: string | null
          keywords?: string[]
          tags?: string[]
          category?: string
          target_url: string
          anchor_text?: string | null
          published_url?: string | null
          status?: string
          is_trial_post?: boolean
          claimed?: boolean
          expires_at?: string | null
          view_count?: number
          seo_score?: number
          reading_time?: number
          word_count?: number
          featured_image?: string | null
          author_name?: string
          author_avatar?: string | null
          contextual_links?: Json
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          meta_description?: string | null
          keywords?: string[]
          tags?: string[]
          category?: string
          target_url?: string
          anchor_text?: string | null
          published_url?: string | null
          status?: string
          is_trial_post?: boolean
          claimed?: boolean
          expires_at?: string | null
          view_count?: number
          seo_score?: number
          reading_time?: number
          word_count?: number
          featured_image?: string | null
          author_name?: string
          author_avatar?: string | null
          contextual_links?: Json
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          completed_backlinks: string[] | null
          created_at: string
          credits_used: number
          id: string
          keywords: string[]
          links_delivered: number
          links_requested: number
          name: string
          status: string
          target_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_backlinks?: string[] | null
          created_at?: string
          credits_used?: number
          id?: string
          keywords: string[]
          links_delivered?: number
          links_requested: number
          name: string
          status?: string
          target_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_backlinks?: string[] | null
          created_at?: string
          credits_used?: number
          id?: string
          keywords?: string[]
          links_delivered?: number
          links_requested?: number
          name?: string
          status?: string
          target_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          total_purchased: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      global_campaign_ledger: {
        Row: {
          backlinks_delivered: number
          campaign_id: string
          campaign_name: string
          completed_at: string
          created_at: string
          id: string
          keyword_difficulty_avg: number | null
          keywords_count: number
          user_location_country: string
          user_location_country_code: string
        }
        Insert: {
          backlinks_delivered: number
          campaign_id: string
          campaign_name: string
          completed_at?: string
          created_at?: string
          id?: string
          keyword_difficulty_avg?: number | null
          keywords_count: number
          user_location_country: string
          user_location_country_code: string
        }
        Update: {
          backlinks_delivered?: number
          campaign_id?: string
          campaign_name?: string
          completed_at?: string
          created_at?: string
          id?: string
          keyword_difficulty_avg?: number | null
          keywords_count?: number
          user_location_country?: string
          user_location_country_code?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          email: string
          guest_checkout: boolean | null
          id: string
          payment_method: string
          paypal_order_id: string | null
          product_name: string
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          email: string
          guest_checkout?: boolean | null
          id?: string
          payment_method: string
          paypal_order_id?: string | null
          product_name: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          email?: string
          guest_checkout?: boolean | null
          id?: string
          payment_method?: string
          paypal_order_id?: string | null
          product_name?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ranking_results: {
        Row: {
          backlinks_count: number | null
          checked_at: string
          competitor_analysis: Json | null
          created_at: string
          error_details: Json | null
          found: boolean
          id: string
          position: number | null
          search_engine: string
          serp_features: Json | null
          target_id: string
          total_results: number | null
        }
        Insert: {
          backlinks_count?: number | null
          checked_at?: string
          competitor_analysis?: Json | null
          created_at?: string
          error_details?: Json | null
          found?: boolean
          id?: string
          position?: number | null
          search_engine: string
          serp_features?: Json | null
          target_id: string
          total_results?: number | null
        }
        Update: {
          backlinks_count?: number | null
          checked_at?: string
          competitor_analysis?: Json | null
          created_at?: string
          error_details?: Json | null
          found?: boolean
          id?: string
          position?: number | null
          search_engine?: string
          serp_features?: Json | null
          target_id?: string
          total_results?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_results_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "ranking_dashboard"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "ranking_results_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "ranking_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_targets: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          keyword: string
          name: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          keyword: string
          name?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          keyword?: string
          name?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          guest_checkout: boolean | null
          id: string
          payment_method: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          guest_checkout?: boolean | null
          id?: string
          payment_method?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          guest_checkout?: boolean | null
          id?: string
          payment_method?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ranking_dashboard: {
        Row: {
          average_position: number | null
          best_position: number | null
          bing_backlinks: number | null
          bing_checked_at: string | null
          bing_found: boolean | null
          bing_position: number | null
          domain: string | null
          google_backlinks: number | null
          google_checked_at: string | null
          google_found: boolean | null
          google_position: number | null
          is_active: boolean | null
          keyword: string | null
          name: string | null
          target_created_at: string | null
          target_id: string | null
          target_updated_at: string | null
          url: string | null
          user_id: string | null
          yahoo_backlinks: number | null
          yahoo_checked_at: string | null
          yahoo_found: boolean | null
          yahoo_position: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["user_role_type"]
        }
        Returns: boolean
      }
      // get_current_user_role function removed due to infinite recursion
      // Use direct role checks in RLS policies instead
      get_user_role: {
        Args: { check_user_id?: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
    }
    Enums: {
      app_role: "admin" | "premium" | "user"
      user_role_type: "admin" | "moderator" | "user"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "premium", "user"],
      user_role_type: ["admin", "moderator", "user"],
    },
  },
} as const
