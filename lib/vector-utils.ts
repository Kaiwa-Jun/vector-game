/**
 * Calculates the dot product of two vectors
 */
export function dotProduct(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  return vectorA.reduce((sum, a, i) => sum + a * (vectorB[i] || 0), 0);
}

/**
 * Calculates the magnitude (length) of a vector
 */
export function magnitude(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

/**
 * Normalizes a vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const mag = magnitude(vector);
  
  if (mag === 0) {
    throw new Error('Cannot normalize zero vector');
  }
  
  return vector.map(val => val / mag);
}

/**
 * Calculates cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical vectors
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const magA = magnitude(vectorA);
  const magB = magnitude(vectorB);
  
  if (magA === 0 || magB === 0) {
    throw new Error('Cannot calculate similarity with zero vectors');
  }
  
  const dot = dotProduct(vectorA, vectorB);
  return dot / (magA * magB);
}