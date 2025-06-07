import { 
  calculateCosineSimilarity, 
  normalizeVector, 
  dotProduct,
  magnitude 
} from '@/lib/vector-utils';

describe('Vector utilities', () => {
  describe('dotProduct', () => {
    it('should calculate dot product correctly', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [4, 5, 6];
      
      const result = dotProduct(vectorA, vectorB);
      
      expect(result).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    });

    it('should handle zero vectors', () => {
      const vectorA = [0, 0, 0];
      const vectorB = [1, 2, 3];
      
      const result = dotProduct(vectorA, vectorB);
      
      expect(result).toBe(0);
    });

    it('should throw error for vectors of different lengths', () => {
      const vectorA = [1, 2];
      const vectorB = [1, 2, 3];
      
      expect(() => dotProduct(vectorA, vectorB)).toThrow();
    });
  });

  describe('magnitude', () => {
    it('should calculate vector magnitude correctly', () => {
      const vector = [3, 4]; // 3-4-5 triangle
      
      const result = magnitude(vector);
      
      expect(result).toBe(5);
    });

    it('should handle zero vector', () => {
      const vector = [0, 0, 0];
      
      const result = magnitude(vector);
      
      expect(result).toBe(0);
    });

    it('should handle unit vector', () => {
      const vector = [1, 0, 0];
      
      const result = magnitude(vector);
      
      expect(result).toBe(1);
    });
  });

  describe('normalizeVector', () => {
    it('should normalize vector to unit length', () => {
      const vector = [3, 4];
      
      const result = normalizeVector(vector);
      
      expect(result).toEqual([0.6, 0.8]);
      expect(magnitude(result)).toBeCloseTo(1, 10);
    });

    it('should handle already normalized vector', () => {
      const vector = [1, 0, 0];
      
      const result = normalizeVector(vector);
      
      expect(result).toEqual([1, 0, 0]);
    });

    it('should throw error for zero vector', () => {
      const vector = [0, 0, 0];
      
      expect(() => normalizeVector(vector)).toThrow();
    });
  });

  describe('calculateCosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [1, 0, 0];
      
      const result = calculateCosineSimilarity(vectorA, vectorB);
      
      expect(result).toBe(1); // Identical vectors
    });

    it('should return 0 for orthogonal vectors', () => {
      const vectorA = [1, 0];
      const vectorB = [0, 1];
      
      const result = calculateCosineSimilarity(vectorA, vectorB);
      
      expect(result).toBe(0);
    });

    it('should return -1 for opposite vectors', () => {
      const vectorA = [1, 0];
      const vectorB = [-1, 0];
      
      const result = calculateCosineSimilarity(vectorA, vectorB);
      
      expect(result).toBe(-1);
    });

    it('should handle similar vectors', () => {
      const vectorA = [1, 1];
      const vectorB = [1, 2];
      
      const result = calculateCosineSimilarity(vectorA, vectorB);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should throw error for zero vectors', () => {
      const vectorA = [0, 0];
      const vectorB = [1, 1];
      
      expect(() => calculateCosineSimilarity(vectorA, vectorB)).toThrow();
    });

    it('should handle high-dimensional vectors', () => {
      const vectorA = new Array(1536).fill(1);
      const vectorB = new Array(1536).fill(1);
      
      const result = calculateCosineSimilarity(vectorA, vectorB);
      
      expect(result).toBeCloseTo(1, 10);
    });
  });
});