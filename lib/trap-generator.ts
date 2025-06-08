import {
  findSimilarWords,
  getRandomWords,
  checkWordSimilarity,
} from './similarity-search'
import { getPopularWords } from './database'
import type { PopularWord } from './supabase'

export interface TrapWord {
  word: string
  similarity: number
  category: 'low_similarity' | 'category_different' | 'random'
}

export interface TrapGenerationResult {
  trapWords: TrapWord[]
  error?: string
}

/**
 * Difficulty levels for trap word generation
 */
export enum DifficultyLevel {
  EASY = 1, // 0.1 - 0.3 similarity
  MEDIUM = 2, // 0.3 - 0.5 similarity
  HARD = 3, // 0.5 - 0.7 similarity
}

/**
 * Get similarity range based on difficulty level
 */
function getSimilarityRange(difficulty: DifficultyLevel): {
  min: number
  max: number
} {
  switch (difficulty) {
    case DifficultyLevel.EASY:
      return { min: 0.1, max: 0.3 }
    case DifficultyLevel.MEDIUM:
      return { min: 0.3, max: 0.5 }
    case DifficultyLevel.HARD:
      return { min: 0.5, max: 0.7 }
    default:
      return { min: 0.1, max: 0.3 }
  }
}

/**
 * Generate trap words for a given base word
 */
export async function generateTrapWords(
  baseWord: string,
  correctAnswers: string[],
  difficulty: DifficultyLevel = DifficultyLevel.EASY,
  count: number = 1
): Promise<TrapGenerationResult> {
  try {
    const trapWords: TrapWord[] = []
    const { min, max } = getSimilarityRange(difficulty)
    const excludeWords = [baseWord, ...correctAnswers]

    // Strategy 1: Find words with controlled similarity
    const similarityTrapWords = await findWordsWithSimilarity(
      baseWord,
      excludeWords,
      min,
      max,
      Math.ceil(count * 0.6) // 60% of trap words from similarity range
    )
    trapWords.push(...similarityTrapWords)

    // Strategy 2: Get category-different words (if we need more)
    if (trapWords.length < count) {
      const categoryTrapWords = await findCategoryDifferentWords(
        baseWord,
        excludeWords.concat(trapWords.map(t => t.word)),
        count - trapWords.length
      )
      trapWords.push(...categoryTrapWords)
    }

    // Strategy 3: Random words as fallback
    if (trapWords.length < count) {
      const randomTrapWords = await getRandomTrapWords(
        excludeWords.concat(trapWords.map(t => t.word)),
        count - trapWords.length
      )
      trapWords.push(...randomTrapWords)
    }

    // Shuffle the trap words
    const shuffledTrapWords = trapWords
      .sort(() => Math.random() - 0.5)
      .slice(0, count)

    return {
      trapWords: shuffledTrapWords,
    }
  } catch (error) {
    console.error('Error generating trap words:', error)
    return {
      trapWords: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Find words with specific similarity range to the base word
 */
async function findWordsWithSimilarity(
  baseWord: string,
  excludeWords: string[],
  minSimilarity: number,
  maxSimilarity: number,
  count: number
): Promise<TrapWord[]> {
  try {
    // Get a larger set of similar words first
    const { similarWords } = await findSimilarWords(baseWord, 50, 0.0)

    // Filter words that fall within our desired similarity range
    const filteredWords = similarWords.filter(
      word =>
        word.similarity >= minSimilarity &&
        word.similarity <= maxSimilarity &&
        !excludeWords.includes(word.word)
    )

    // Take the requested number of words
    return filteredWords.slice(0, count).map(word => ({
      word: word.word,
      similarity: word.similarity,
      category: 'low_similarity' as const,
    }))
  } catch (error) {
    console.error('Error finding words with similarity:', error)
    return []
  }
}

/**
 * Find words from different categories (less semantic similarity)
 */
async function findCategoryDifferentWords(
  baseWord: string,
  excludeWords: string[],
  count: number
): Promise<TrapWord[]> {
  try {
    // Get popular words which are likely from different categories
    const popularWords = await getPopularWords(100)
    const candidateWords: string[] = []

    // Filter popular words and check if they're different enough
    for (const popular of popularWords) {
      if (excludeWords.includes(popular.base_word)) continue

      // Quick check: if word length is very different, it might be from different category
      const lengthDiff = Math.abs(baseWord.length - popular.base_word.length)
      if (lengthDiff > 2) {
        candidateWords.push(popular.base_word)
      }
    }

    // If we don't have enough candidates, use random selection from popular words
    if (candidateWords.length < count) {
      const remainingPopular = popularWords
        .filter(
          p =>
            !excludeWords.includes(p.base_word) &&
            !candidateWords.includes(p.base_word)
        )
        .slice(0, count - candidateWords.length)

      candidateWords.push(
        ...remainingPopular.map(p => p.base_word).filter(Boolean)
      )
    }

    // Verify similarity and create trap words
    const trapWords: TrapWord[] = []
    for (let i = 0; i < Math.min(count, candidateWords.length); i++) {
      const word = candidateWords[i]
      if (!word) continue

      // For performance, we'll assume these are category different
      // In a production system, you might want to verify similarity
      trapWords.push({
        word,
        similarity: 0.1, // Assumed low similarity
        category: 'category_different',
      })
    }

    return trapWords
  } catch (error) {
    console.error('Error finding category different words:', error)
    return []
  }
}

/**
 * Get random trap words as fallback
 */
async function getRandomTrapWords(
  excludeWords: string[],
  count: number
): Promise<TrapWord[]> {
  try {
    const randomWords = await getRandomWords(excludeWords, count)

    return randomWords.map(word => ({
      word,
      similarity: 0.05, // Very low similarity
      category: 'random' as const,
    }))
  } catch (error) {
    console.error('Error getting random trap words:', error)
    return []
  }
}

/**
 * Validate trap word quality
 */
export async function validateTrapWord(
  baseWord: string,
  trapWord: string,
  correctAnswers: string[],
  difficulty: DifficultyLevel
): Promise<boolean> {
  try {
    const { min, max } = getSimilarityRange(difficulty)

    // Check similarity with base word
    const similarity = await checkWordSimilarity(baseWord, trapWord)

    // Should not be too similar to the base word
    if (similarity > max) return false

    // Should not be too dissimilar (except for easy mode)
    if (difficulty !== DifficultyLevel.EASY && similarity < min) return false

    // Should not be too similar to any correct answer
    for (const correctAnswer of correctAnswers) {
      const answerSimilarity = await checkWordSimilarity(
        trapWord,
        correctAnswer
      )
      if (answerSimilarity > 0.8) return false
    }

    return true
  } catch (error) {
    console.error('Error validating trap word:', error)
    return false
  }
}

/**
 * Pre-compute trap candidates for popular words
 */
export async function preComputeTrapCandidates(
  baseWord: string,
  difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
): Promise<TrapWord[]> {
  try {
    // Generate a larger set of trap words for caching
    const result = await generateTrapWords(baseWord, [], difficulty, 10)
    return result.trapWords
  } catch (error) {
    console.error('Error pre-computing trap candidates:', error)
    return []
  }
}

/**
 * Calculate difficulty level based on stage
 */
export function calculateDifficultyForStage(stage: number): DifficultyLevel {
  if (stage <= 3) return DifficultyLevel.EASY
  if (stage <= 7) return DifficultyLevel.MEDIUM
  return DifficultyLevel.HARD
}

/**
 * Adaptive difficulty adjustment based on player performance
 */
export function adjustDifficultyForPerformance(
  currentDifficulty: DifficultyLevel,
  recentCorrectAnswers: number,
  totalRecentAnswers: number
): DifficultyLevel {
  if (totalRecentAnswers < 3) return currentDifficulty

  const successRate = recentCorrectAnswers / totalRecentAnswers

  // If player is doing too well, increase difficulty
  if (successRate > 0.8 && currentDifficulty < DifficultyLevel.HARD) {
    return currentDifficulty + 1
  }

  // If player is struggling, decrease difficulty
  if (successRate < 0.4 && currentDifficulty > DifficultyLevel.EASY) {
    return currentDifficulty - 1
  }

  return currentDifficulty
}
