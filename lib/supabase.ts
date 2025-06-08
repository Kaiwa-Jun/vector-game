import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client with fallback values for build time
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

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

/**
 * Check if Supabase is properly configured
 */
function checkSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }
}

/**
 * Get popular words for game word selection
 */
export async function getPopularWords(
  limit: number = 20
): Promise<PopularWord[]> {
  checkSupabaseConfig()
  
  const { data, error } = await supabase
    .from('popular_words')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch popular words: ${error.message}`)
  }

  return data || []
}

/**
 * Get or create a vector for a word
 */
export async function getOrCreateVector(
  word: string,
  embedding?: number[]
): Promise<Vector> {
  checkSupabaseConfig()
  
  // First try to get existing vector
  const { data: existingVector, error: selectError } = await supabase
    .from('vectors')
    .select('*')
    .eq('word', word)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Failed to check existing vector: ${selectError.message}`)
  }

  if (existingVector) {
    return existingVector
  }

  // Create new vector if it doesn't exist
  if (!embedding) {
    throw new Error('Embedding is required for new vector')
  }

  const { data: newVector, error: insertError } = await supabase
    .from('vectors')
    .insert({
      word,
      embedding: JSON.stringify(embedding),
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create vector: ${insertError.message}`)
  }

  return newVector
}

/**
 * Create a new game session for vector maze
 */
export async function createVectorMazeSession(
  gameData: any
): Promise<GameSession> {
  checkSupabaseConfig()
  
  const sessionData: GameSessionInsert = {
    game_type: 'vector-maze',
    score: 0,
    session_data: gameData,
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create game session: ${error.message}`)
  }

  return data as GameSession
}

/**
 * Get a game session by ID
 */
export async function getVectorMazeSession(
  gameId: string
): Promise<GameSession | null> {
  checkSupabaseConfig()
  
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', gameId)
    .eq('game_type', 'vector-maze')
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch game session: ${error.message}`)
  }

  return data as GameSession | null
}

/**
 * Update a vector maze game session
 */
export async function updateVectorMazeSession(
  gameId: string,
  sessionData: any,
  score?: number
): Promise<GameSession> {
  checkSupabaseConfig()
  
  const updates: GameSessionUpdate = {
    session_data: sessionData,
    updated_at: new Date().toISOString(),
  }

  if (score !== undefined) {
    updates.score = score
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .update(updates)
    .eq('id', gameId)
    .eq('game_type', 'vector-maze')
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update game session: ${error.message}`)
  }

  return data as GameSession
}

/**
 * Cache word similarity result
 */
export async function cacheWordSimilarity(
  word1: string,
  word2: string,
  similarity: number
): Promise<void> {
  checkSupabaseConfig()
  
  const { error } = await supabase.from('word_similarities').upsert({
    word1,
    word2,
    similarity_score: similarity,
  })

  if (error) {
    console.warn(`Failed to cache similarity: ${error.message}`)
  }
}

/**
 * Get cached word similarity
 */
export async function getCachedSimilarity(
  word1: string,
  word2: string
): Promise<number | null> {
  checkSupabaseConfig()
  
  const { data, error } = await supabase
    .from('word_similarities')
    .select('similarity_score')
    .or(
      `and(word1.eq.${word1},word2.eq.${word2}),and(word1.eq.${word2},word2.eq.${word1})`
    )
    .single()

  if (error && error.code !== 'PGRST116') {
    console.warn(`Failed to get cached similarity: ${error.message}`)
  }

  return data?.similarity_score || null
}
