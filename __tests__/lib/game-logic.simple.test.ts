// Mock Supabase before importing
jest.mock('@/lib/supabase', () => ({
  getPopularWords: jest.fn(),
  createGameSession: jest.fn(),
  getGameSession: jest.fn(),
  updateGameSession: jest.fn(),
}))

import {
  getDifficultySettings,
  isGoalReached,
  calculateFinalScore,
} from '@/lib/game-logic'

describe('Game logic (unit tests)', () => {
  describe('getDifficultySettings', () => {
    it('should return easy difficulty settings', () => {
      const settings = getDifficultySettings('easy')

      expect(settings).toHaveProperty('targetSimilarity')
      expect(settings).toHaveProperty('maxMoves')
      expect(settings).toHaveProperty('timeLimit')
      expect(settings.targetSimilarity).toBeGreaterThan(0.7)
    })

    it('should return medium difficulty settings', () => {
      const settings = getDifficultySettings('medium')

      expect(settings.targetSimilarity).toBeLessThan(0.7)
      expect(settings.targetSimilarity).toBeGreaterThan(0.5)
    })

    it('should return hard difficulty settings', () => {
      const settings = getDifficultySettings('hard')

      expect(settings.targetSimilarity).toBeLessThan(0.5)
    })

    it('should default to medium for invalid difficulty', () => {
      const settings = getDifficultySettings('invalid' as any)

      expect(settings).toEqual(getDifficultySettings('medium'))
    })
  })

  describe('isGoalReached', () => {
    it('should return true when similarity meets target', () => {
      const result = isGoalReached(0.85, 0.8)
      expect(result).toBe(true)
    })

    it('should return false when similarity is below target', () => {
      const result = isGoalReached(0.75, 0.8)
      expect(result).toBe(false)
    })

    it('should handle exact match', () => {
      const result = isGoalReached(0.8, 0.8)
      expect(result).toBe(true)
    })
  })

  describe('calculateFinalScore', () => {
    it('should calculate score for successful game', () => {
      const gameData = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog', 'animal'],
        startTime: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        targetSimilarity: 0.8,
        isActive: true,
      }

      const result = calculateFinalScore(gameData, true)

      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('isSuccess')
      expect(result.isSuccess).toBe(true)
      expect(result.score).toBeGreaterThan(0)
    })

    it('should calculate score for failed game', () => {
      const gameData = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog', 'animal'],
        startTime: new Date(Date.now() - 60000).toISOString(),
        targetSimilarity: 0.8,
        isActive: true,
      }

      const result = calculateFinalScore(gameData, false)

      expect(result.isSuccess).toBe(false)
      expect(result.score).toBe(0)
    })

    it('should penalize for more moves', () => {
      const gameData1 = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog'],
        startTime: new Date(Date.now() - 60000).toISOString(),
        targetSimilarity: 0.8,
        isActive: true,
      }

      const gameData2 = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog', 'animal', 'pet', 'mammal'],
        startTime: new Date(Date.now() - 60000).toISOString(),
        targetSimilarity: 0.8,
        isActive: true,
      }

      const result1 = calculateFinalScore(gameData1, true)
      const result2 = calculateFinalScore(gameData2, true)

      expect(result1.score).toBeGreaterThan(result2.score)
    })

    it('should penalize for longer time', () => {
      const gameData1 = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog'],
        startTime: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        targetSimilarity: 0.8,
        isActive: true,
      }

      const gameData2 = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog'],
        startTime: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        targetSimilarity: 0.8,
        isActive: true,
      }

      const result1 = calculateFinalScore(gameData1, true)
      const result2 = calculateFinalScore(gameData2, true)

      expect(result1.score).toBeGreaterThan(result2.score)
    })
  })
})
