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
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          is_family_verified: boolean
          relationship_to_author: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          is_family_verified?: boolean
          relationship_to_author?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          is_family_verified?: boolean
          relationship_to_author?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          episode_number: number | null
          audio_url: string | null
          thumbnail_url: string | null
          transcript_question: string | null
          transcript_answer: string | null
          duration: string | null
          is_published: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          episode_number?: number | null
          audio_url?: string | null
          thumbnail_url?: string | null
          transcript_question?: string | null
          transcript_answer?: string | null
          duration?: string | null
          is_published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          episode_number?: number | null
          audio_url?: string | null
          thumbnail_url?: string | null
          transcript_question?: string | null
          transcript_answer?: string | null
          duration?: string | null
          is_published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      story_tags: {
        Row: {
          story_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          story_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          story_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string
        }
      }
      story_visibility: {
        Row: {
          story_id: string
          visibility_type: string
          created_at: string
        }
        Insert: {
          story_id: string
          visibility_type: string
          created_at?: string
        }
        Update: {
          story_id?: string
          visibility_type?: string
          created_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 