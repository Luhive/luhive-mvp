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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          cover_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          page_config: Json | null
          parent_community_id: string | null
          settings: Json | null
          slug: string
          social_links: Json | null
          stats: Json | null
          tagline: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          page_config?: Json | null
          parent_community_id?: string | null
          settings?: Json | null
          slug: string
          social_links?: Json | null
          stats?: Json | null
          tagline?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          page_config?: Json | null
          parent_community_id?: string | null
          settings?: Json | null
          slug?: string
          social_links?: Json | null
          stats?: Json | null
          tagline?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_parent_community_id_fkey"
            columns: ["parent_community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string | null
          custom_title: string | null
          id: string
          joined_at: string | null
          metadata: Json | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          custom_title?: string | null
          id?: string
          joined_at?: string | null
          metadata?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          custom_title?: string | null
          id?: string
          joined_at?: string | null
          metadata?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_visits: {
        Row: {
          community_id: string | null
          id: string
          metadata: Json | null
          session_id: string
          user_id: string | null
          visited_at: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          metadata?: Json | null
          session_id: string
          user_id?: string | null
          visited_at?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string
          user_id?: string | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_visits_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_waitlist: {
        Row: {
          community_name: string
          created_at: string | null
          description: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          community_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          community_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          anonymous_email: string | null
          anonymous_name: string | null
          anonymous_phone: string | null
          event_id: string
          id: string
          is_verified: boolean
          registered_at: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
          verification_token: string | null
        }
        Insert: {
          anonymous_email?: string | null
          anonymous_name?: string | null
          anonymous_phone?: string | null
          event_id: string
          id?: string
          is_verified?: boolean
          registered_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Update: {
          anonymous_email?: string | null
          anonymous_name?: string | null
          anonymous_phone?: string | null
          event_id?: string
          id?: string
          is_verified?: boolean
          registered_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          community_id: string
          cover_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          discussion_link: string | null
          end_time: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location_address: string | null
          online_meeting_link: string | null
          registration_deadline: string | null
          slug: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          community_id: string
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          discussion_link?: string | null
          end_time?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          location_address?: string | null
          online_meeting_link?: string | null
          registration_deadline?: string | null
          slug?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          community_id?: string
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          discussion_link?: string | null
          end_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location_address?: string | null
          online_meeting_link?: string | null
          registration_deadline?: string | null
          slug?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          gamification: Json | null
          id: string
          metadata: Json | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          gamification?: Json | null
          id: string
          metadata?: Json | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          gamification?: Json | null
          id?: string
          metadata?: Json | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist_requests: {
        Row: {
          community_name: string
          created_at: string | null
          email_address: string
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          community_name: string
          created_at?: string | null
          email_address: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          community_name?: string
          created_at?: string | null
          email_address?: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { p_community_id: string }; Returns: string }
    }
    Enums: {
      event_status: "draft" | "published" | "cancelled"
      event_type: "in-person" | "online" | "hybrid"
      rsvp_status: "going" | "not_going" | "maybe"
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
      event_status: ["draft", "published", "cancelled"],
      event_type: ["in-person", "online", "hybrid"],
      rsvp_status: ["going", "not_going", "maybe"],
    },
  },
} as const
