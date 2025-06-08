import { findSimilarWords } from './similarity-search'
import {
  generateTrapWords,
  calculateDifficultyForStage,
  adjustDifficultyForPerformance,
  DifficultyLevel,
} from './trap-generator'
import {
  createGameSession,
  updateGameSession,
  getGameSession,
  incrementWordUsage,
  getPopularWords,
} from './database'
import type { GameSession } from './supabase'

export interface SurvivalGameState {
  gameId: string
  stage: number
  score: number
  lives: number
  currentBaseWord: string
  recentAnswers: boolean[] // Track recent answers for adaptive difficulty
  difficulty: DifficultyLevel
  isGameOver: boolean
}

export interface GameChoice {
  word: string
  isCorrect: boolean
}

export interface SurvivalRound {
  baseWord: string
  choices: GameChoice[]
  stage: number
  lives: number
  score: number
}

export interface SurvivalAnswerResult {
  isCorrect: boolean
  correctAnswer?: string
  score: number
  lives: number
  stage: number
  isGameOver: boolean
  gameOverReason?: 'no_lives' | 'max_stage'
}

const INITIAL_LIVES = 3
const MAX_STAGE = 20
const CORRECT_ANSWER_POINTS = 100
const STAGE_BONUS_MULTIPLIER = 10

/**
 * Generate a random base word for survival game
 */
async function generateRandomBaseWord(): Promise<string> {
  try {
    // Get popular words from database
    const popularWords = await getPopularWords(50)

    if (popularWords.length > 0) {
      // Select a random word from popular words
      const randomIndex = Math.floor(Math.random() * popularWords.length)
      return popularWords[randomIndex]?.base_word || 'cat'
    }

    // Fallback to predefined words if database is empty
    const fallbackWords = [
      'cat',
      'dog',
      'car',
      'house',
      'book',
      'music',
      'food',
      'water',
      'tree',
      'flower',
      'sun',
      'moon',
      'computer',
      'phone',
      'game',
      'love',
      'happy',
      'beautiful',
      'strong',
      'fast',
    ]

    const randomIndex = Math.floor(Math.random() * fallbackWords.length)
    return fallbackWords[randomIndex] || 'cat'
  } catch (error) {
    console.error('Error generating random base word:', error)
    return 'cat' // Ultimate fallback
  }
}

/**
 * Start a new survival game with system-generated base word
 */
export async function startSurvivalGame(): Promise<SurvivalGameState> {
  console.log('🎯 [Survival Logic] ゲーム開始処理開始')

  try {
    // Generate random base word
    const baseWord = await generateRandomBaseWord()
    console.log('🎯 [Survival Logic] 基準語生成:', baseWord)

    // Create game session in database
    const session = await createGameSession('survival', {
      baseWord,
      stage: 1,
      score: 0,
      lives: INITIAL_LIVES,
      recentAnswers: [],
      difficulty: DifficultyLevel.EASY,
      isGameOver: false,
    })

    // Increment word usage for analytics
    try {
      await incrementWordUsage(baseWord)
    } catch (error) {
      console.error('Error incrementing word usage:', error)
      // Don't fail the game start if analytics fail
    }

    const gameState = {
      gameId: session.id,
      stage: 1,
      score: 0,
      lives: INITIAL_LIVES,
      currentBaseWord: baseWord,
      recentAnswers: [],
      difficulty: DifficultyLevel.EASY,
      isGameOver: false,
    }

    console.log('🎯 [Survival Logic] ゲーム開始完了:', {
      gameId: session.id,
      baseWord,
    })
    return gameState
  } catch (error) {
    console.error('❌ [Survival Logic] ゲーム開始エラー:', error)
    throw new Error('Failed to start survival game')
  }
}

/**
 * Get the current game state
 */
export async function getSurvivalGameState(
  gameId: string
): Promise<SurvivalGameState | null> {
  try {
    const session = await getGameSession(gameId)

    if (!session || session.game_type !== 'survival') {
      return null
    }

    const sessionData = session.session_data as any

    return {
      gameId: session.id,
      stage: session.current_stage || 1,
      score: session.score || 0,
      lives: session.lives || INITIAL_LIVES,
      currentBaseWord: sessionData?.baseWord || '',
      recentAnswers: sessionData?.recentAnswers || [],
      difficulty: sessionData?.difficulty || DifficultyLevel.EASY,
      isGameOver: sessionData?.isGameOver || false,
    }
  } catch (error) {
    console.error('Error getting survival game state:', error)
    return null
  }
}

/**
 * Generate choices for current round
 */
export async function generateSurvivalRound(
  gameId: string
): Promise<SurvivalRound> {
  console.log('🎯 [Survival Logic] ラウンド生成開始:', gameId)

  try {
    const gameState = await getSurvivalGameState(gameId)

    if (!gameState || gameState.isGameOver) {
      throw new Error('Game not found or already over')
    }

    console.log(
      '🎯 [Survival Logic] 基準語:',
      gameState.currentBaseWord,
      'ステージ:',
      gameState.stage
    )

    // Get similar words (correct answers)
    const { similarWords, error } = await findSimilarWords(
      gameState.currentBaseWord,
      5, // Get 5 similar words
      0.7 // High similarity threshold for correct answers
    )

    if (error || similarWords.length === 0) {
      throw new Error('Failed to find similar words')
    }

    // Select correct answers (top 5 similar words)
    const correctAnswers = similarWords.slice(0, 5)

    // Generate trap words based on current difficulty
    const { trapWords } = await generateTrapWords(
      gameState.currentBaseWord,
      correctAnswers.map(w => w.word),
      gameState.difficulty,
      1 // Generate 1 trap word
    )

    // Create choices array (5 correct + 1 trap)
    const choices: GameChoice[] = [
      ...correctAnswers.map(word => ({
        word: word.word,
        isCorrect: true,
      })),
      ...trapWords.map(trap => ({
        word: trap.word,
        isCorrect: false,
      })),
    ]

    // Shuffle choices
    const shuffledChoices = choices.sort(() => Math.random() - 0.5)

    console.log(
      '🎯 [Survival Logic] 選択肢生成完了:',
      shuffledChoices.length,
      '個'
    )

    return {
      baseWord: gameState.currentBaseWord,
      choices: shuffledChoices,
      stage: gameState.stage,
      lives: gameState.lives,
      score: gameState.score,
    }
  } catch (error) {
    console.error('❌ [Survival Logic] ラウンド生成エラー:', error)
    throw new Error('Failed to generate round')
  }
}

/**
 * Process player's answer
 */
export async function processSurvivalAnswer(
  gameId: string,
  selectedWord: string
): Promise<SurvivalAnswerResult> {
  console.log('🎯 [Survival Logic] 回答処理開始:', selectedWord)

  try {
    const gameState = await getSurvivalGameState(gameId)

    if (!gameState || gameState.isGameOver) {
      throw new Error('Game not found or already over')
    }

    // Get similar words to determine if answer is correct
    const { similarWords } = await findSimilarWords(
      gameState.currentBaseWord,
      5,
      0.7
    )

    const correctWords = similarWords.map(w => w.word)
    const isCorrect = correctWords.includes(selectedWord)

    console.log('🎯 [Survival Logic] 回答判定:', isCorrect ? '正解' : '不正解')

    // Update score and lives
    let newScore = gameState.score
    let newLives = gameState.lives
    let newStage = gameState.stage

    if (isCorrect) {
      // Award points for correct answer
      const stageBonus = gameState.stage * STAGE_BONUS_MULTIPLIER
      newScore += CORRECT_ANSWER_POINTS + stageBonus
      newStage += 1
    } else {
      // Lose a life for incorrect answer
      newLives -= 1
    }

    // Update recent answers for adaptive difficulty
    const newRecentAnswers = [...gameState.recentAnswers, isCorrect].slice(-5) // Keep last 5 answers

    // Adjust difficulty based on performance
    const newDifficulty = adjustDifficultyForPerformance(
      gameState.difficulty,
      newRecentAnswers.filter(answer => answer).length,
      newRecentAnswers.length
    )

    // Check if game is over
    const isGameOver = newLives <= 0 || newStage > MAX_STAGE
    const gameOverReason =
      newLives <= 0
        ? 'no_lives'
        : newStage > MAX_STAGE
          ? 'max_stage'
          : undefined

    console.log('🎯 [Survival Logic] 更新後状態:', {
      score: newScore,
      lives: newLives,
      stage: newStage,
      isGameOver,
    })

    // Update game session in database
    await updateGameSession(gameId, {
      current_stage: newStage,
      score: newScore,
      lives: newLives,
      session_data: {
        baseWord: gameState.currentBaseWord,
        recentAnswers: newRecentAnswers,
        difficulty: newDifficulty,
        isGameOver,
      },
    })

    return {
      isCorrect,
      correctAnswer: isCorrect ? undefined : correctWords[0], // Show one correct answer if wrong
      score: newScore,
      lives: newLives,
      stage: newStage,
      isGameOver,
      gameOverReason,
    }
  } catch (error) {
    console.error('❌ [Survival Logic] 回答処理エラー:', error)
    throw new Error('Failed to process answer')
  }
}

/**
 * Calculate final score with bonuses
 */
export function calculateFinalScore(
  baseScore: number,
  stage: number,
  lives: number
): number {
  const stageBonus = stage * 50
  const livesBonus = lives * 100
  return baseScore + stageBonus + livesBonus
}

/**
 * Get leaderboard data (simplified version)
 */
export async function getSurvivalLeaderboard(
  limit: number = 10
): Promise<any[]> {
  try {
    // This would typically query a leaderboard table
    // For now, return empty array as we don't have leaderboard implementation
    return []
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return []
  }
}

/**
 * Reset game to a specific stage (for testing/debugging)
 */
export async function resetSurvivalGame(
  gameId: string,
  stage: number = 1,
  lives: number = INITIAL_LIVES
): Promise<SurvivalGameState> {
  try {
    const gameState = await getSurvivalGameState(gameId)

    if (!gameState) {
      throw new Error('Game not found')
    }

    // Update game session
    await updateGameSession(gameId, {
      current_stage: stage,
      lives: lives,
      session_data: {
        ...gameState,
        stage,
        lives,
        isGameOver: false,
        recentAnswers: [],
      },
    })

    return {
      ...gameState,
      stage,
      lives,
      isGameOver: false,
      recentAnswers: [],
    }
  } catch (error) {
    console.error('Error resetting survival game:', error)
    throw new Error('Failed to reset game')
  }
}

/**
 * Get game statistics
 */
export function getGameStatistics(gameState: SurvivalGameState): any {
  const correctAnswers = gameState.recentAnswers.filter(answer => answer).length
  const totalAnswers = gameState.recentAnswers.length
  const accuracyRate =
    totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

  return {
    stage: gameState.stage,
    score: gameState.score,
    lives: gameState.lives,
    accuracy: Math.round(accuracyRate),
    difficulty: DifficultyLevel[gameState.difficulty],
    isGameOver: gameState.isGameOver,
  }
}

/**
 * Validate game session
 */
export function isValidGameSession(gameState: SurvivalGameState): boolean {
  return !!(
    gameState.gameId &&
    gameState.stage > 0 &&
    gameState.lives >= 0 &&
    gameState.score >= 0 &&
    gameState.currentBaseWord
  )
}
