/**
 * Supabase Database Types
 * 
 * This file can be auto-generated using:
 * npx supabase gen types typescript --project-id qigfvouunlunkconlcqk > src/types/supabase.ts
 * 
 * For now, we define types manually based on our schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "moderator" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "moderator" | "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "moderator" | "admin";
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          title: string;
          body: string | null;
          author_id: string;
          author_display_name: string | null;
          anonymous: boolean;
          status: "draft" | "review" | "published" | "rejected" | "unpublished";
          rejection_reason: string | null;
          featured: boolean;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          timeline_year: number | null;
          timeline_decade: number | null;
          location_name: string | null;
          location_lat: number | null;
          location_lng: number | null;
          ai_summary: string | null;
          ai_tags: string[] | null;
          soft_deleted: boolean;
          deletion_requested: boolean;
          deletion_requested_at: string | null;
          deletion_reason: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          body?: string | null;
          author_id: string;
          author_display_name?: string | null;
          anonymous?: boolean;
          status?: "draft" | "review" | "published" | "rejected" | "unpublished";
          rejection_reason?: string | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          timeline_year?: number | null;
          timeline_decade?: number | null;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          soft_deleted?: boolean;
          deletion_requested?: boolean;
          deletion_requested_at?: string | null;
          deletion_reason?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string | null;
          author_id?: string;
          author_display_name?: string | null;
          anonymous?: boolean;
          status?: "draft" | "review" | "published" | "rejected" | "unpublished";
          rejection_reason?: string | null;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          timeline_year?: number | null;
          timeline_decade?: number | null;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          soft_deleted?: boolean;
          deletion_requested?: boolean;
          deletion_requested_at?: string | null;
          deletion_reason?: string | null;
        };
      };
      media: {
        Row: {
          id: string;
          story_id: string;
          type: "image" | "video" | "audio";
          url: string;
          caption: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          type: "image" | "video" | "audio";
          url: string;
          caption?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          type?: "image" | "video" | "audio";
          url?: string;
          caption?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          body: string;
          status: "visible" | "hidden" | "flagged";
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          body: string;
          status?: "visible" | "hidden" | "flagged";
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          user_id?: string;
          body?: string;
          status?: "visible" | "hidden" | "flagged";
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      story_collections: {
        Row: {
          story_id: string;
          collection_id: string;
          added_at: string;
        };
        Insert: {
          story_id: string;
          collection_id: string;
          added_at?: string;
        };
        Update: {
          story_id?: string;
          collection_id?: string;
          added_at?: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          title: string;
          body: string;
          active: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          active?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          active?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      sport_clubs: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string;
          club_name: string | null;
          sport_type: string | null;
          team_name: string | null;
          year_taken: string | null;
          season: string | null;
          location_name: string | null;
          location_lat: number | null;
          location_lng: number | null;
          source_credit: string | null;
          view_count: number;
          like_count: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url: string;
          club_name?: string | null;
          sport_type?: string | null;
          team_name?: string | null;
          year_taken?: string | null;
          season?: string | null;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          source_credit?: string | null;
          view_count?: number;
          like_count?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          club_name?: string | null;
          sport_type?: string | null;
          team_name?: string | null;
          year_taken?: string | null;
          season?: string | null;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          source_credit?: string | null;
          view_count?: number;
          like_count?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      sport_clubs_images: {
        Row: {
          id: string;
          sport_club_id: string;
          image_url: string;
          caption: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sport_club_id: string;
          image_url: string;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sport_club_id?: string;
          image_url?: string;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      story_status: "draft" | "review" | "published" | "rejected" | "unpublished";
      media_type: "image" | "video" | "audio";
      comment_status: "visible" | "hidden" | "flagged";
      user_role: "user" | "moderator" | "admin";
    };
  };
};

// Helper types for easier use
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
