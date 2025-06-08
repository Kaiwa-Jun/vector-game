import { supabase } from './supabase'
import type {
  Vector,
  WordSimilarity,
  PopularWord,
  GameSession,
  VectorInsert,
  GameSessionInsert,
  GameSessionUpdate,
  MatchVectorsResult,
} from './supabase'

// ベクトル検索関数
export async function searchSimilarWords(
  embedding: string, // pgvectorでは文字列として扱われる
  limit: number = 10,
  threshold: number = 0.7
): Promise<MatchVectorsResult[]> {
  const { data, error } = await supabase.rpc('match_vectors', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    throw error
  }

  return data || []
}

// 単語のベクトルを取得
export async function getWordVector(word: string): Promise<Vector | null> {
  const { data, error } = await supabase
    .from('vectors')
    .select('*')
    .eq('word', word)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // レコードが見つからない場合
    }
    throw error
  }

  return data
}

// ベクトルを保存
export async function saveWordVector(
  word: string,
  embedding: string
): Promise<Vector> {
  const { data, error } = await supabase
    .from('vectors')
    .upsert({
      word,
      embedding,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// 類似度キャッシュを取得
export async function getCachedSimilarity(
  word1: string,
  word2: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('word_similarities')
    .select('similarity_score')
    .or(
      `and(word1.eq.${word1},word2.eq.${word2}),and(word1.eq.${word2},word2.eq.${word1})`
    )
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // キャッシュが見つからない場合
    }
    throw error
  }

  return data.similarity_score
}

// 類似度をキャッシュに保存
export async function cacheSimilarity(
  word1: string,
  word2: string,
  similarity: number
): Promise<void> {
  const { error } = await supabase.from('word_similarities').upsert({
    word1,
    word2,
    similarity_score: similarity,
  })

  if (error) {
    throw error
  }
}

// 人気語を取得
export async function getPopularWords(
  limit: number = 50
): Promise<PopularWord[]> {
  const { data, error } = await supabase
    .from('popular_words')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data || []
}

// 人気語の使用回数を更新
export async function incrementWordUsage(baseWord: string): Promise<void> {
  const { error } = await supabase.rpc('increment_word_usage', {
    base_word: baseWord,
  })

  if (error) {
    throw error
  }
}

// ゲームセッションを作成
export async function createGameSession(
  gameType: string,
  sessionData?: any
): Promise<GameSession> {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      game_type: gameType,
      session_data: sessionData,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// ゲームセッションを更新
export async function updateGameSession(
  sessionId: string,
  updates: GameSessionUpdate
): Promise<GameSession> {
  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// ゲームセッションを取得
export async function getGameSession(
  sessionId: string
): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}
