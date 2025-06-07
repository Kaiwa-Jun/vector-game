import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmbedding } from '@/lib/openai';
import { calculateCosineSimilarity } from '@/lib/vector-utils';
import { isGoalReached } from '@/lib/game-logic';
import { 
  getVectorMazeSession, 
  updateVectorMazeSession, 
  getOrCreateVector,
  getCachedSimilarity,
  cacheWordSimilarity 
} from '@/lib/supabase';
import { SimilarityRequest, SimilarityResponse, VectorMazeGameData } from '@/types/api';

const SimilaritySchema = z.object({
  gameId: z.string().min(1),
  inputWord: z.string().min(1),
  targetWord: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SimilaritySchema.parse(body);

    // Check if game session exists and is active
    const gameSession = await getVectorMazeSession(validatedData.gameId);
    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    const gameData = gameSession.session_data as unknown as VectorMazeGameData;
    if (!gameData.isActive) {
      return NextResponse.json(
        { error: 'Game session is no longer active' },
        { status: 400 }
      );
    }

    // Check for cached similarity first
    let similarity = await getCachedSimilarity(
      validatedData.inputWord, 
      validatedData.targetWord
    );

    if (similarity === null) {
      // Get embeddings for both words
      const [inputEmbedding, targetEmbedding] = await Promise.all([
        getEmbedding(validatedData.inputWord),
        getEmbedding(validatedData.targetWord),
      ]);

      // Calculate similarity
      similarity = calculateCosineSimilarity(inputEmbedding, targetEmbedding);

      // Cache the result
      await cacheWordSimilarity(
        validatedData.inputWord,
        validatedData.targetWord,
        similarity
      );

      // Store vectors in database for future use
      await Promise.all([
        getOrCreateVector(validatedData.inputWord, inputEmbedding),
        getOrCreateVector(validatedData.targetWord, targetEmbedding),
      ]);
    }

    // Check if goal is reached
    const goalReached = isGoalReached(similarity, gameData.targetSimilarity);

    // Calculate score (simple scoring for now)
    const currentMoves = gameData.moves || [];
    const newMoves = [...currentMoves, validatedData.inputWord];
    let score = gameSession.score || 0;

    if (goalReached) {
      // Bonus points for reaching goal
      score += Math.max(100 - (newMoves.length * 10), 10);
    } else {
      // Small points for progress
      score += Math.round(similarity * 10);
    }

    // Update game data
    const updatedGameData: VectorMazeGameData = {
      ...gameData,
      moves: newMoves,
      isActive: !goalReached,
      endTime: goalReached ? new Date().toISOString() : gameData.endTime,
    };

    // Update game session with new move
    await updateVectorMazeSession(validatedData.gameId, updatedGameData, score);

    const response: SimilarityResponse = {
      similarity: Math.round(similarity * 1000) / 1000, // Round to 3 decimal places
      isGoalReached: goalReached,
      score: score,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating similarity:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}