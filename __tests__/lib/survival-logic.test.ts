// Mock the dependencies before importing the actual module
jest.mock('@/lib/database', () => ({
  createGameSession: jest.fn(),
  updateGameSession: jest.fn(),
  getGameSession: jest.fn(),
  incrementWordUsage: jest.fn(),
}))

jest.mock('@/lib/similarity-search', () => ({
  findSimilarWords: jest.fn(),
}))

jest.mock('@/lib/trap-generator', () => ({
  generateTrapWords: jest.fn(),
  calculateDifficultyForStage: jest.fn(),
  adjustDifficultyForPerformance: jest.fn(),
  DifficultyLevel: {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
  },
}))

import { calculateFinalScore, isValidGameSession } from '@/lib/survival-logic'
import { DifficultyLevel } from '@/lib/trap-generator'

describe('Survival Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateFinalScore', () => {
    it('should calculate final score with bonuses', () => {
      const baseScore = 1000
      const stage = 10
      const lives = 2

      const finalScore = calculateFinalScore(baseScore, stage, lives)

      // Base score + stage bonus (10 * 50) + lives bonus (2 * 100)
      expect(finalScore).toBe(1000 + 500 + 200)
    })

    it('should handle zero lives', () => {
      const baseScore = 500
      const stage = 5
      const lives = 0

      const finalScore = calculateFinalScore(baseScore, stage, lives)

      expect(finalScore).toBe(500 + 250 + 0)
    })
  })

  describe('isValidGameSession', () => {
    it('should validate correct game session', () => {
      const validSession = {
        gameId: 'test-id',
        stage: 1,
        score: 0,
        lives: 3,
        currentBaseWord: 'test',
        recentAnswers: [],
        difficulty: DifficultyLevel.EASY,
        isGameOver: false,
      }

      expect(isValidGameSession(validSession)).toBe(true)
    })

    it('should invalidate session with missing fields', () => {
      const invalidSession = {
        gameId: '',
        stage: 1,
        score: 0,
        lives: 3,
        currentBaseWord: 'test',
        recentAnswers: [],
        difficulty: DifficultyLevel.EASY,
        isGameOver: false,
      }

      expect(isValidGameSession(invalidSession)).toBe(false)
    })

    it('should invalidate session with negative values', () => {
      const invalidSession = {
        gameId: 'test-id',
        stage: -1,
        score: 0,
        lives: 3,
        currentBaseWord: 'test',
        recentAnswers: [],
        difficulty: DifficultyLevel.EASY,
        isGameOver: false,
      }

      expect(isValidGameSession(invalidSession)).toBe(false)
    })
  })
})
