import { NextRequest } from 'next/server';
import { POST } from '@/app/api/vector-maze/similarity/route';
import { SimilarityRequest, SimilarityResponse } from '@/types/api';

// Mock dependencies
jest.mock('@/lib/openai');
jest.mock('@/lib/vector-utils');
jest.mock('@/lib/supabase');

describe('/api/vector-maze/similarity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate similarity between words', async () => {
    const requestBody: SimilarityRequest = {
      gameId: 'test-game-id',
      inputWord: 'cat',
      targetWord: 'dog'
    };

    const request = new NextRequest('http://localhost:3000/api/vector-maze/similarity', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data: SimilarityResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('similarity');
    expect(data).toHaveProperty('isGoalReached');
    expect(data).toHaveProperty('score');
    expect(typeof data.similarity).toBe('number');
    expect(typeof data.isGoalReached).toBe('boolean');
    expect(typeof data.score).toBe('number');
    expect(data.similarity).toBeGreaterThanOrEqual(0);
    expect(data.similarity).toBeLessThanOrEqual(1);
  });

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/vector-maze/similarity', {
      method: 'POST',
      body: JSON.stringify({ gameId: 'test-id' }), // missing inputWord and targetWord
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 404 for invalid game ID', async () => {
    const requestBody: SimilarityRequest = {
      gameId: 'invalid-game-id',
      inputWord: 'cat',
      targetWord: 'dog'
    };

    // Mock game session not found
    const { getGameSession } = require('@/lib/supabase');
    getGameSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/vector-maze/similarity', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it('should handle goal reached scenario', async () => {
    const requestBody: SimilarityRequest = {
      gameId: 'test-game-id',
      inputWord: 'dog',
      targetWord: 'dog'
    };

    // Mock high similarity (goal reached)
    const { calculateCosineSimilarity } = require('@/lib/vector-utils');
    calculateCosineSimilarity.mockResolvedValueOnce(0.95);

    const request = new NextRequest('http://localhost:3000/api/vector-maze/similarity', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data: SimilarityResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data.isGoalReached).toBe(true);
    expect(data.similarity).toBeGreaterThan(0.9);
  });

  it('should return 500 for OpenAI API error', async () => {
    const requestBody: SimilarityRequest = {
      gameId: 'test-game-id',
      inputWord: 'cat',
      targetWord: 'dog'
    };

    // Mock OpenAI API error
    const { getEmbedding } = require('@/lib/openai');
    getEmbedding.mockRejectedValueOnce(new Error('OpenAI API error'));

    const request = new NextRequest('http://localhost:3000/api/vector-maze/similarity', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});