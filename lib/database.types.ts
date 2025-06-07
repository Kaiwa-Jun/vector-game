export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          created_at: string | null
          current_stage: number | null
          game_type: string
          id: string
          lives: number | null
          score: number | null
          session_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_stage?: number | null
          game_type: string
          id?: string
          lives?: number | null
          score?: number | null
          session_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_stage?: number | null
          game_type?: string
          id?: string
          lives?: number | null
          score?: number | null
          session_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      popular_words: {
        Row: {
          base_word: string
          created_at: string | null
          difficulty_level: number | null
          id: string
          similar_words: Json
          trap_candidates: Json
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          base_word: string
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          similar_words: Json
          trap_candidates: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          base_word?: string
          created_at?: string | null
          difficulty_level?: number | null
          id?: string
          similar_words?: Json
          trap_candidates?: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      vectors: {
        Row: {
          created_at: string | null
          embedding: string
          id: string
          updated_at: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: string
          updated_at?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: string
          updated_at?: string | null
          word?: string
        }
        Relationships: []
      }
      word_similarities: {
        Row: {
          created_at: string | null
          id: string
          similarity_score: number
          word1: string
          word2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          similarity_score: number
          word1: string
          word2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          similarity_score?: number
          word1?: string
          word2?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_word_usage: {
        Args: { base_word: string }
        Returns: undefined
      }
      match_vectors: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          word: string
          embedding: string
          created_at: string
          updated_at: string
          similarity: number
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
