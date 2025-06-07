import { GameSession, VectorMazeGameData } from '@/types/api'
import { getPopularWords } from '@/lib/supabase'

export interface DifficultySettings {
  targetSimilarity: number
  maxMoves: number
  timeLimit: number // in seconds
}

export interface WordPair {
  startWord: string
  goalWord: string
  targetSimilarity: number
}

export interface ScoreResult {
  score: number
  isSuccess: boolean
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
        targetSimilarity: 0.8,
        maxMoves: 10,
        timeLimit: 300, // 5 minutes
      }
    case 'hard':
      return {
        targetSimilarity: 0.4,
        maxMoves: 15,
        timeLimit: 600, // 10 minutes
      }
    case 'medium':
    default:
      return {
        targetSimilarity: 0.6,
        maxMoves: 12,
        timeLimit: 480, // 8 minutes
      }
  }
}

/**
 * Generates a start and goal word pair based on difficulty
 */
export async function generateWordPair(
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<WordPair> {
  const settings = getDifficultySettings(difficulty)

  try {
    // Get popular words from database
    const words = await getPopularWords(20)

    if (words.length < 2) {
      throw new Error('Not enough words available in database')
    }

    // Randomly select start and goal words ensuring they're different
    let startWord: string
    let goalWord: string

    do {
      const startIndex = Math.floor(Math.random() * words.length)
      const goalIndex = Math.floor(Math.random() * words.length)

      startWord = words[startIndex]?.base_word || 'cat'
      goalWord = words[goalIndex]?.base_word || 'dog'
    } while (startWord === goalWord)

    return {
      startWord,
      goalWord,
      targetSimilarity: settings.targetSimilarity,
    }
  } catch (error) {
    console.error('Error generating word pair:', error)
    throw error
  }
}

/**
 * Checks if the goal has been reached based on similarity score
 */
export function isGoalReached(
  similarity: number,
  targetSimilarity: number
): boolean {
  return similarity >= targetSimilarity
}

/**
 * Calculates the final score for a completed game
 */
export function calculateFinalScore(
  gameData: VectorMazeGameData,
  isSuccess: boolean
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
  const timeBonus = Math.max(0, 300 - timeElapsedSeconds) // Bonus for completing under 5 minutes
  score += timeBonus

  // Move penalty (prefer fewer moves)
  const movesPenalty = Math.max(0, (moves.length - 3) * 50) // Penalty for more than 3 moves
  score -= movesPenalty

  // Ensure minimum score of 1 for successful completion
  score = Math.max(1, Math.round(score))

  return {
    score,
    isSuccess: true,
  }
}
