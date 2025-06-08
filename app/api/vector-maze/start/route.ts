import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWordPair, getDifficultySettings } from '@/lib/game-logic'
import { createVectorMazeSession } from '@/lib/supabase'
import {
  GameStartRequest,
  GameStartResponse,
  VectorMazeGameData,
} from '@/types/api'

const GameStartSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = GameStartSchema.parse(body)

    // Generate word pair based on difficulty
    const wordPair = await generateWordPair(validatedData.difficulty)
    const difficultySettings = getDifficultySettings(validatedData.difficulty)

    // Create game session data
    const gameData: VectorMazeGameData = {
      startWord: wordPair.startWord,
      goalWord: wordPair.goalWord,
      targetSimilarity: wordPair.targetSimilarity,
      requiredIntermediateWords: wordPair.requiredIntermediateWords,
      intermediateWords: [], // Array to store player's intermediate words
      moves: [],
      isActive: true,
      startTime: new Date().toISOString(),
      difficulty: validatedData.difficulty,
    }

    // Create game session
    const gameSession = await createVectorMazeSession(gameData)

    const response: GameStartResponse = {
      gameId: gameSession.id,
      startWord: wordPair.startWord,
      goalWord: wordPair.goalWord,
      targetSimilarity: wordPair.targetSimilarity,
      requiredIntermediateWords: wordPair.requiredIntermediateWords,
      maxMoves: difficultySettings.maxMoves,
      timeLimit: difficultySettings.timeLimit,
      adjacencyTolerance: difficultySettings.adjacencyTolerance,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
