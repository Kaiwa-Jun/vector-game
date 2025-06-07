import { NextRequest } from 'next/server';
import { POST } from '@/app/api/vector-maze/finish/route';
import { GameFinishRequest, GameFinishResponse } from '@/types/api';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/game-logic');

describe('/api/vector-maze/finish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should finish a game and return final score', async () => {
    const requestBody: GameFinishRequest = {
      gameId: 'test-game-id'
    };

    const request = new NextRequest('http://localhost:3000/api/vector-maze/finish', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data: GameFinishResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('finalScore');
    expect(data).toHaveProperty('totalMoves');
    expect(data).toHaveProperty('timeElapsed');
    expect(data).toHaveProperty('isSuccess');
    expect(typeof data.finalScore).toBe('number');
    expect(typeof data.totalMoves).toBe('number');
    expect(typeof data.timeElapsed).toBe('number');
    expect(typeof data.isSuccess).toBe('boolean');
  });

  it('should return 400 for missing game ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/vector-maze/finish', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 404 for invalid game ID', async () => {
    const requestBody: GameFinishRequest = {
      gameId: 'invalid-game-id'
    };

    // Mock game session not found
    const { getGameSession } = require('@/lib/supabase');
    getGameSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/vector-maze/finish', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it('should return 400 for already finished game', async () => {
    const requestBody: GameFinishRequest = {
      gameId: 'finished-game-id'
    };

    // Mock already finished game
    const { getGameSession } = require('@/lib/supabase');
    getGameSession.mockResolvedValueOnce({
      id: 'finished-game-id',
      isActive: false,
      endTime: new Date()
    });

    const request = new NextRequest('http://localhost:3000/api/vector-maze/finish', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should calculate correct score for successful game', async () => {
    const requestBody: GameFinishRequest = {
      gameId: 'success-game-id'
    };

    // Mock successful game session
    const { getGameSession, updateGameSession } = require('@/lib/supabase');
    const { calculateFinalScore } = require('@/lib/game-logic');
    
    getGameSession.mockResolvedValueOnce({
      id: 'success-game-id',
      isActive: true,
      moves: ['cat', 'dog', 'animal'],
      startTime: new Date(Date.now() - 60000), // 1 minute ago
      targetSimilarity: 0.8
    });

    calculateFinalScore.mockReturnValueOnce({
      score: 100,
      isSuccess: true
    });

    const request = new NextRequest('http://localhost:3000/api/vector-maze/finish', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data: GameFinishResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data.isSuccess).toBe(true);
    expect(data.finalScore).toBe(100);
    expect(data.totalMoves).toBe(3);
    expect(data.timeElapsed).toBeGreaterThan(0);
  });
});