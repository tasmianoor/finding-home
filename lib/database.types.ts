export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface StorageError {
  message: string
  name: string
  statusCode?: number
  error?: string
  details?: string
  hint?: string
  code?: string
}

export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          title: string
          description: string
          episode_number: number
          audio_url: string
          video_url: string | null
          thumbnail_url: string
          transcript_question: string
          transcript_answer: string
          duration: number
          is_published: boolean
          view_count: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          episode_number?: number
          audio_url: string
          video_url?: string | null
          thumbnail_url?: string
          transcript_question: string
          transcript_answer: string
          duration: number
          is_published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          episode_number?: number
          audio_url?: string
          video_url?: string | null
          thumbnail_url?: string
          transcript_question?: string
          transcript_answer?: string
          duration?: number
          is_published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      story_tags: {
        Row: {
          story_id: string
          tag_id: string
        }
        Insert: {
          story_id: string
          tag_id: string
        }
        Update: {
          story_id?: string
          tag_id?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          story_id: string
          user_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          story_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          story_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          relation: string
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          relation: string
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          relation?: string
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Storage: {
      avatars: {
        path: string
        id: string
        name: string
        updated_at: string
        created_at: string
        last_accessed_at: string
        metadata: {
          size: number
          mimetype: string
          cacheControl: string
        }
      }
    }
  }
} 