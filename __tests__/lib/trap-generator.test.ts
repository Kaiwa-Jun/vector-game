// Mock the imports before importing the actual module
jest.mock('@/lib/similarity-search', () => ({
  findSimilarWords: jest.fn(),
  getRandomWords: jest.fn(),
  checkWordSimilarity: jest.fn(),
}))

jest.mock('@/lib/database', () => ({
  getPopularWords: jest.fn(),
}))

import {
  calculateDifficultyForStage,
  adjustDifficultyForPerformance,
  DifficultyLevel,
} from '@/lib/trap-generator'

describe('Trap Generator', () => {
  describe('calculateDifficultyForStage', () => {
    it('should return EASY for early stages', () => {
      expect(calculateDifficultyForStage(1)).toBe(DifficultyLevel.EASY)
      expect(calculateDifficultyForStage(3)).toBe(DifficultyLevel.EASY)
    })

    it('should return MEDIUM for middle stages', () => {
      expect(calculateDifficultyForStage(4)).toBe(DifficultyLevel.MEDIUM)
      expect(calculateDifficultyForStage(7)).toBe(DifficultyLevel.MEDIUM)
    })

    it('should return HARD for late stages', () => {
      expect(calculateDifficultyForStage(8)).toBe(DifficultyLevel.HARD)
      expect(calculateDifficultyForStage(15)).toBe(DifficultyLevel.HARD)
    })
  })

  describe('adjustDifficultyForPerformance', () => {
    it('should maintain difficulty with insufficient data', () => {
      const currentDifficulty = DifficultyLevel.MEDIUM
      const result = adjustDifficultyForPerformance(currentDifficulty, 2, 2)
      expect(result).toBe(currentDifficulty)
    })

    it('should increase difficulty for high performance', () => {
      const currentDifficulty = DifficultyLevel.EASY // 1
      const result = adjustDifficultyForPerformance(currentDifficulty, 5, 5) // 100% success (> 0.8)
      expect(result).toBe(2) // Should be MEDIUM (2)
    })

    it('should decrease difficulty for low performance', () => {
      const currentDifficulty = DifficultyLevel.HARD // 3
      const result = adjustDifficultyForPerformance(currentDifficulty, 1, 5) // 20% success
      expect(result).toBe(2) // Should be MEDIUM (2)
    })

    it('should not increase beyond HARD', () => {
      const currentDifficulty = DifficultyLevel.HARD // 3
      const result = adjustDifficultyForPerformance(currentDifficulty, 5, 5) // 100% success
      expect(result).toBe(3) // Should stay HARD (3)
    })

    it('should not decrease below EASY', () => {
      const currentDifficulty = DifficultyLevel.EASY // 1
      const result = adjustDifficultyForPerformance(currentDifficulty, 0, 5) // 0% success
      expect(result).toBe(1) // Should stay EASY (1)
    })
  })
})
