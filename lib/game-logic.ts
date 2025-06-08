import { GameSession, VectorMazeGameData } from '@/types/api'
import { getPopularWords } from '@/lib/supabase'
import { checkWordSimilarity } from '@/lib/similarity-search'

export interface DifficultySettings {
  targetSimilarity: number
  maxMoves: number
  timeLimit: number // in seconds
  adjacencyTolerance: number // ±% for adjacent word similarity
  requiredIntermediateWords: number
}

export interface WordPair {
  startWord: string
  goalWord: string
  targetSimilarity: number
  requiredIntermediateWords: number
}

export interface ScoreResult {
  score: number
  isSuccess: boolean
}

export interface WordChainValidation {
  isValid: boolean
  invalidStep?: number // Which step failed (0-based index)
  message?: string
  similarities?: number[] // Similarities between adjacent words
}

export interface IntermediateWordInput {
  word: string
  position: number // 0-based position in the chain
}

/**
 * Gets difficulty settings based on difficulty level
 */
export function getDifficultySettings(
  difficulty: 'easy' | 'medium' | 'hard'
): DifficultySettings {
  switch (difficulty) {
    case 'easy':
      return {
        targetSimilarity: 0.4, // Lower threshold for easier completion
        maxMoves: 10,
        timeLimit: 300, // 5 minutes
        adjacencyTolerance: 0.3, // ±30% tolerance
        requiredIntermediateWords: 2,
      }
    case 'hard':
      return {
        targetSimilarity: 0.3, // Even lower for hard mode
        maxMoves: 20,
        timeLimit: 600, // 10 minutes
        adjacencyTolerance: 0.15, // ±15% tolerance
        requiredIntermediateWords: 4,
      }
    case 'medium':
    default:
      return {
        targetSimilarity: 0.35,
        maxMoves: 15,
        timeLimit: 480, // 8 minutes
        adjacencyTolerance: 0.2, // ±20% tolerance
        requiredIntermediateWords: 3,
      }
  }
}

/**
 * Generates a start and goal word pair with low similarity
 */
export async function generateWordPair(
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<WordPair> {
  const settings = getDifficultySettings(difficulty)

  try {
    let startWord: string = 'cat'
    let goalWord: string = 'car'
    let similarity: number = 0.1

    try {
      // Get popular words from database
      const words = await getPopularWords(50)

      if (words.length >= 10) {
        // Try to find words with low similarity
        let attempts = 0
        const maxAttempts = 20

        do {
          const startIndex = Math.floor(Math.random() * words.length)
          const goalIndex = Math.floor(Math.random() * words.length)

          if (startIndex === goalIndex) continue

          startWord = words[startIndex]?.base_word || 'cat'
          goalWord = words[goalIndex]?.base_word || 'car'

          // Check similarity between start and goal
          similarity = await checkWordSimilarity(startWord, goalWord)
          attempts++

          // We want low similarity (< 0.3) between start and goal
        } while (similarity > 0.3 && attempts < maxAttempts)

        // If we couldn't find low similarity words, use fallback
        if (similarity > 0.3) {
          throw new Error('Could not find dissimilar words')
        }
      } else {
        throw new Error('Not enough words in database')
      }
    } catch (dbError: any) {
      // Fallback to predefined dissimilar word pairs
      const dissimilarPairs = [
        { start: 'cat', goal: 'car', similarity: 0.1 },
        { start: 'book', goal: 'tree', similarity: 0.15 },
        { start: 'music', goal: 'house', similarity: 0.12 },
        { start: 'happy', goal: 'computer', similarity: 0.08 },
        { start: 'water', goal: 'phone', similarity: 0.1 },
        { start: 'flower', goal: 'game', similarity: 0.13 },
        { start: 'sun', goal: 'food', similarity: 0.11 },
        { start: 'love', goal: 'machine', similarity: 0.09 },
      ]

      const randomPair =
        dissimilarPairs[Math.floor(Math.random() * dissimilarPairs.length)]
      startWord = randomPair?.start || 'cat'
      goalWord = randomPair?.goal || 'car'
      similarity = randomPair?.similarity || 0.1
    }

    return {
      startWord,
      goalWord,
      targetSimilarity: settings.targetSimilarity,
      requiredIntermediateWords: settings.requiredIntermediateWords,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Validates a complete word chain with adjacency constraints
 */
export async function validateWordChain(
  startWord: string,
  intermediateWords: string[],
  goalWord: string,
  adjacencyTolerance: number
): Promise<WordChainValidation> {
  try {
    const fullChain = [startWord, ...intermediateWords, goalWord]
    const similarities: number[] = []

    // Check each adjacent pair
    for (let i = 0; i < fullChain.length - 1; i++) {
      const word1 = fullChain[i]
      const word2 = fullChain[i + 1]

      if (!word1 || !word2) {
        return {
          isValid: false,
          invalidStep: i,
          message: `Missing word at position ${i + 1}`,
        }
      }

      const similarity = await checkWordSimilarity(word1, word2)
      similarities.push(similarity)

      // Check if similarity is within acceptable range
      // We want some similarity but not too much (to make it challenging)
      const minSimilarity = 0.1 // Minimum required similarity
      const maxSimilarity = 0.8 // Maximum allowed similarity

      if (similarity < minSimilarity) {
        return {
          isValid: false,
          invalidStep: i,
          message: `Words "${word1}" and "${word2}" are too dissimilar (${(similarity * 100).toFixed(1)}%). Try a word more similar to "${word1}".`,
          similarities,
        }
      }

      if (similarity > maxSimilarity) {
        return {
          isValid: false,
          invalidStep: i,
          message: `Words "${word1}" and "${word2}" are too similar (${(similarity * 100).toFixed(1)}%). Try a more different word.`,
          similarities,
        }
      }
    }

    // Check if the final similarity reaches the goal
    const finalSimilarity = similarities[similarities.length - 1] || 0

    return {
      isValid: true,
      similarities,
    }
  } catch (error) {
    console.error('Error validating word chain:', error)
    return {
      isValid: false,
      message: 'Error validating word chain',
    }
  }
}

/**
 * Validates a single intermediate word input
 */
export async function validateIntermediateWord(
  previousWord: string,
  inputWord: string,
  nextWord?: string
): Promise<{ isValid: boolean; similarity?: number; message?: string }> {
  try {
    // Check similarity with previous word
    const similarity = await checkWordSimilarity(previousWord, inputWord)

    const minSimilarity = 0.1
    const maxSimilarity = 0.8

    if (similarity < minSimilarity) {
      return {
        isValid: false,
        similarity,
        message: `"${inputWord}" is too dissimilar to "${previousWord}" (${(similarity * 100).toFixed(1)}%). Try a more similar word.`,
      }
    }

    if (similarity > maxSimilarity) {
      return {
        isValid: false,
        similarity,
        message: `"${inputWord}" is too similar to "${previousWord}" (${(similarity * 100).toFixed(1)}%). Try a more different word.`,
      }
    }

    // If there's a next word, check that constraint too
    if (nextWord) {
      const nextSimilarity = await checkWordSimilarity(inputWord, nextWord)
      if (nextSimilarity < minSimilarity || nextSimilarity > maxSimilarity) {
        return {
          isValid: false,
          similarity,
          message: `"${inputWord}" doesn't work well with the next word in the chain.`,
        }
      }
    }

    return {
      isValid: true,
      similarity,
    }
  } catch (error) {
    console.error('Error validating intermediate word:', error)
    return {
      isValid: false,
      message: 'Error validating word',
    }
  }
}

/**
 * Checks if the goal has been reached
 */
export function isGoalReached(
  wordChainValidation: WordChainValidation,
  targetSimilarity: number
): boolean {
  if (!wordChainValidation.isValid || !wordChainValidation.similarities) {
    return false
  }

  // Check if the final similarity (last word to goal) meets the target
  const finalSimilarity =
    wordChainValidation.similarities[
      wordChainValidation.similarities.length - 1
    ]
  return finalSimilarity !== undefined && finalSimilarity >= targetSimilarity
}

/**
 * Calculates the final score for a completed game
 */
export function calculateFinalScore(
  gameData: VectorMazeGameData,
  isSuccess: boolean,
  wordChainValidation?: WordChainValidation
): ScoreResult {
  if (!isSuccess) {
    return {
      score: 0,
      isSuccess: false,
    }
  }

  const moves = gameData.moves || []
  const startTime = new Date(gameData.startTime)
  const endTime = new Date()

  // Base score for success
  let score = 1000

  // Time bonus/penalty (prefer faster completion)
  const timeElapsedSeconds = (endTime.getTime() - startTime.getTime()) / 1000
  const timeBonus = Math.max(0, 600 - timeElapsedSeconds) // Bonus for completing under 10 minutes
  score += timeBonus * 0.5

  // Move efficiency bonus (prefer fewer attempts)
  const movesPenalty = Math.max(0, (moves.length - 5) * 20) // Penalty for more than 5 attempts
  score -= movesPenalty

  // Chain quality bonus (reward good similarity progression)
  if (wordChainValidation?.similarities) {
    const avgSimilarity =
      wordChainValidation.similarities.reduce((a, b) => a + b, 0) /
      wordChainValidation.similarities.length
    const qualityBonus = avgSimilarity * 200 // Bonus for good similarity balance
    score += qualityBonus
  }

  // Ensure minimum score of 1 for successful completion
  score = Math.max(1, Math.round(score))

  return {
    score,
    isSuccess: true,
  }
}
