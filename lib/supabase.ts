import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Database types (using generated types from Supabase)
export type Vector = Database['public']['Tables']['vectors']['Row']
export type VectorInsert = Database['public']['Tables']['vectors']['Insert']
export type VectorUpdate = Database['public']['Tables']['vectors']['Update']

export type WordSimilarity =
  Database['public']['Tables']['word_similarities']['Row']
export type WordSimilarityInsert =
  Database['public']['Tables']['word_similarities']['Insert']
export type WordSimilarityUpdate =
  Database['public']['Tables']['word_similarities']['Update']

export type PopularWord = Database['public']['Tables']['popular_words']['Row']
export type PopularWordInsert =
  Database['public']['Tables']['popular_words']['Insert']
export type PopularWordUpdate =
  Database['public']['Tables']['popular_words']['Update']

export type GameSession = Database['public']['Tables']['game_sessions']['Row']
export type GameSessionInsert =
  Database['public']['Tables']['game_sessions']['Insert']
export type GameSessionUpdate =
  Database['public']['Tables']['game_sessions']['Update']

// RPC function types
export type MatchVectorsResult =
  Database['public']['Functions']['match_vectors']['Returns'][0]
