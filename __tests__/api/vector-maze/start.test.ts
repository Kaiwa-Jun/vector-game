// Mock dependencies first
jest.mock('@/lib/openai');
jest.mock('@/lib/game-logic');
jest.mock('@/lib/supabase');

import { POST } from '@/app/api/vector-maze/start/route';
import { GameStartResponse } from '@/types/api';

describe('/api/vector-maze/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the required functions
    const gameLogic = require('@/lib/game-logic');
    const supabase = require('@/lib/supabase');
    
    gameLogic.generateWordPair.mockResolvedValue({
      startWord: 'cat',
      goalWord: 'dog',
      targetSimilarity: 0.6
    });
    
    supabase.createGameSession.mockResolvedValue({
      id: 'test-game-id',
      start_word: 'cat',
      goal_word: 'dog',
      target_similarity: 0.6,
      moves: [],
      score: 0,
      start_time: new Date().toISOString(),
      is_active: true
    });
  });

  it('should start a new game with default difficulty', async () => {
    const mockRequest = {
      json: async () => ({})
    };

    const response = await POST(mockRequest as any);
    const data: GameStartResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('gameId');
    expect(data).toHaveProperty('startWord');
    expect(data).toHaveProperty('goalWord');
    expect(data).toHaveProperty('targetSimilarity');
    expect(typeof data.gameId).toBe('string');
    expect(typeof data.startWord).toBe('string');
    expect(typeof data.goalWord).toBe('string');
    expect(typeof data.targetSimilarity).toBe('number');
    expect(data.targetSimilarity).toBeGreaterThan(0);
    expect(data.targetSimilarity).toBeLessThanOrEqual(1);
  });

  it('should start a new game with specified difficulty', async () => {
    const mockRequest = {
      json: async () => ({ difficulty: 'hard' })
    };

    const response = await POST(mockRequest as any);
    const data: GameStartResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('gameId');
    expect(data).toHaveProperty('startWord');
    expect(data).toHaveProperty('goalWord');
    expect(data).toHaveProperty('targetSimilarity');
  });

  it('should return 400 for invalid difficulty', async () => {
    const mockRequest = {
      json: async () => ({ difficulty: 'invalid' })
    };

    const response = await POST(mockRequest as any);

    expect(response.status).toBe(400);
  });

  it('should return 500 for internal server error', async () => {
    // Mock an error in game logic
    const { generateWordPair } = require('@/lib/game-logic');
    generateWordPair.mockRejectedValueOnce(new Error('Database error'));

    const mockRequest = {
      json: async () => ({})
    };

    const response = await POST(mockRequest as any);

    expect(response.status).toBe(500);
  });
});