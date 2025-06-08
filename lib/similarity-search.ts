import OpenAI from 'openai'
import { supabase } from './supabase'
import { getWordVector, saveWordVector, searchSimilarWords } from './database'
import type { MatchVectorsResult } from './supabase'

// Lazy OpenAI client initialization
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export interface SimilarWord {
  word: string
  similarity: number
}

export interface SimilaritySearchResult {
  similarWords: SimilarWord[]
  error?: string
}

/**
 * Get embeddings for a word using OpenAI API
 */
export async function getWordEmbedding(word: string): Promise<number[]> {
  console.log('🔍 [Similarity Search] 埋め込み取得:', word)

  try {
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: word,
    })

    return response.data[0]?.embedding || []
  } catch (error) {
    console.error('❌ [Similarity Search] 埋め込みエラー:', error)
    throw new Error('Failed to get word embedding')
  }
}

/**
 * Get embeddings with retry and rate limiting
 */
export async function getWordEmbeddingWithRetry(
  word: string,
  maxRetries: number = 3
): Promise<number[]> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const embedding = await getWordEmbedding(word)
      return embedding
    } catch (error) {
      lastError = error as Error

      // If it's a rate limit error, wait before retrying
      if (error instanceof Error && error.message.includes('rate_limit')) {
        const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      // For other errors, don't retry
      break
    }
  }

  throw lastError || new Error('Failed to get embedding after retries')
}

/**
 * Find similar words for a given base word
 */
export async function findSimilarWords(
  baseWord: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<SimilaritySearchResult> {
  console.log('🔍 [Similarity Search] 類似語検索:', baseWord)

  try {
    // First, check if we have the word in our database
    let wordVector = await getWordVector(baseWord)

    if (!wordVector) {
      // Get embedding from OpenAI if not cached
      const embedding = await getWordEmbeddingWithRetry(baseWord)
      const embeddingString = `[${embedding.join(',')}]`

      // Save to database for future use
      wordVector = await saveWordVector(baseWord, embeddingString)
    }

    // Search for similar words using pgvector
    const results = await searchSimilarWords(
      wordVector.embedding,
      limit,
      threshold
    )

    // Filter out the base word itself and format results
    const similarWords: SimilarWord[] = results
      .filter(result => result.word !== baseWord)
      .map(result => ({
        word: result.word,
        similarity: result.similarity,
      }))
      .slice(0, limit)

    console.log('🔍 [Similarity Search] 検索完了:', similarWords.length, '個')

    return {
      similarWords,
    }
  } catch (error) {
    console.error('❌ [Similarity Search] 検索エラー:', error)
    return {
      similarWords: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get random words from database for trap generation
 */
export async function getRandomWords(
  excludeWords: string[],
  limit: number = 10
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('vectors')
      .select('word')
      .not('word', 'in', `(${excludeWords.map(w => `"${w}"`).join(',')})`)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more than needed to filter

    if (error) {
      throw error
    }

    // Shuffle and return requested amount
    const shuffled =
      data
        ?.map(item => item.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, limit) || []

    return shuffled
  } catch (error) {
    console.error('Error getting random words:', error)
    return []
  }
}

/**
 * Check if two words are similar based on their embeddings
 */
export async function checkWordSimilarity(
  word1: string,
  word2: string
): Promise<number> {
  console.log('🔍 [Similarity Search] 類似度計算:', word1, '←→', word2)

  try {
    // Get embeddings for both words
    const [embedding1, embedding2] = await Promise.all([
      getWordEmbeddingWithRetry(word1),
      getWordEmbeddingWithRetry(word2),
    ])

    // Calculate cosine similarity
    const similarity = cosineSimilarity(embedding1, embedding2)

    console.log(
      '🔍 [Similarity Search] 類似度:',
      (similarity * 100).toFixed(1) + '%'
    )

    return similarity
  } catch (error) {
    console.error('❌ [Similarity Search] 類似度エラー:', error)
    return 0
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += (a[i] || 0) * (b[i] || 0)
    normA += (a[i] || 0) * (a[i] || 0)
    normB += (b[i] || 0) * (b[i] || 0)
  }

  const normARoot = Math.sqrt(normA)
  const normBRoot = Math.sqrt(normB)

  if (normARoot === 0 || normBRoot === 0) {
    return 0
  }

  return dotProduct / (normARoot * normBRoot)
}

/**
 * Batch process words for pre-computation
 */
export async function batchProcessWords(
  words: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const batchSize = 5 // Process 5 words at a time to respect rate limits

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)

    // Process batch in parallel
    await Promise.all(
      batch.map(async word => {
        try {
          // Check if word already exists
          const existing = await getWordVector(word)
          if (existing) return

          // Get embedding and save
          const embedding = await getWordEmbeddingWithRetry(word)
          const embeddingString = `[${embedding.join(',')}]`
          await saveWordVector(word, embeddingString)
        } catch (error) {
          console.error(`Error processing word "${word}":`, error)
        }
      })
    )

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, words.length), words.length)
    }

    // Add delay between batches to respect rate limits
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}
