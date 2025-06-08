// Mock Supabase before importing
jest.mock('@/lib/supabase', () => ({
  getPopularWords: jest.fn(),
  createGameSession: jest.fn(),
  getGameSession: jest.fn(),
  updateGameSession: jest.fn(),
}))

// Mock similarity-search
jest.mock('@/lib/similarity-search', () => ({
  checkWordSimilarity: jest.fn().mockResolvedValue(0.8),
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
      expect(settings).toHaveProperty('adjacencyTolerance')
      expect(settings).toHaveProperty('requiredIntermediateWords')
      expect(settings.targetSimilarity).toBe(0.4)
      expect(settings.requiredIntermediateWords).toBe(2)
    })

    it('should return medium difficulty settings', () => {
      const settings = getDifficultySettings('medium')

      expect(settings.targetSimilarity).toBe(0.35)
      expect(settings.requiredIntermediateWords).toBe(3)
    })

    it('should return hard difficulty settings', () => {
      const settings = getDifficultySettings('hard')

      expect(settings.targetSimilarity).toBe(0.3)
      expect(settings.requiredIntermediateWords).toBe(4)
    })

    it('should default to medium for invalid difficulty', () => {
      const settings = getDifficultySettings('invalid' as any)

      expect(settings).toEqual(getDifficultySettings('medium'))
    })
  })

  describe('isGoalReached', () => {
    it('should return true when word chain is valid and meets target', () => {
      const wordChainValidation = {
        isValid: true,
        similarities: [0.5, 0.6, 0.85],
      }
      const result = isGoalReached(wordChainValidation, 0.8)
      expect(result).toBe(true)
    })

    it('should return false when word chain is invalid', () => {
      const wordChainValidation = {
        isValid: false,
        similarities: [0.5, 0.6, 0.85],
      }
      const result = isGoalReached(wordChainValidation, 0.8)
      expect(result).toBe(false)
    })

    it('should return false when final similarity is below target', () => {
      const wordChainValidation = {
        isValid: true,
        similarities: [0.5, 0.6, 0.75],
      }
      const result = isGoalReached(wordChainValidation, 0.8)
      expect(result).toBe(false)
    })

    it('should handle exact match', () => {
      const wordChainValidation = {
        isValid: true,
        similarities: [0.5, 0.6, 0.8],
      }
      const result = isGoalReached(wordChainValidation, 0.8)
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
        requiredIntermediateWords: 2,
        intermediateWords: ['animal', 'pet'],
        difficulty: 'medium' as const,
      }

      const wordChainValidation = {
        isValid: true,
        similarities: [0.5, 0.6, 0.8],
      }

      const result = calculateFinalScore(gameData, true, wordChainValidation)

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
        requiredIntermediateWords: 2,
        intermediateWords: ['animal', 'pet'],
        difficulty: 'medium' as const,
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
        requiredIntermediateWords: 2,
        intermediateWords: ['animal', 'pet'],
        difficulty: 'medium' as const,
      }

      const gameData2 = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog', 'animal', 'pet', 'mammal', 'creature', 'being'],
        startTime: new Date(Date.now() - 60000).toISOString(),
        targetSimilarity: 0.8,
        isActive: true,
        requiredIntermediateWords: 2,
        intermediateWords: ['animal', 'pet'],
        difficulty: 'medium' as const,
      }

      const wordChainValidation = {
        isValid: true,
        similarities: [0.5, 0.6, 0.8],
      }

      const result1 = calculateFinalScore(gameData1, true, wordChainValidation)
      const result2 = calculateFinalScore(gameData2, true, wordChainValidation)

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
        requiredIntermediateWords: 2,
        intermediateWords: ['animal', 'pet'],
        difficulty: 'medium' as const,
      }

      const gameData2 = {
        startWord: 'cat',
        goalWord: 'dog',
        moves: ['cat', 'dog'],
        startTime: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        targetSimilarity: 0.8,
        isActive: true,
        requiredIntermediateWords: 2,
        intermediateWords: ['animal', 'pet'],
        difficulty: 'medium' as const,
      }

      const wordChainValidation = {
        isValid: true,
        similarities: [0.5, 0.6, 0.8],
      }

      const result1 = calculateFinalScore(gameData1, true, wordChainValidation)
      const result2 = calculateFinalScore(gameData2, true, wordChainValidation)

      expect(result1.score).toBeGreaterThan(result2.score)
    })
  })
})
