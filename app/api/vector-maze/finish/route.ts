import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  calculateFinalScore,
  validateWordChain,
  isGoalReached,
  getDifficultySettings,
} from '@/lib/game-logic'
import { getVectorMazeSession, updateVectorMazeSession } from '@/lib/supabase'
import {
  GameFinishRequest,
  GameFinishResponse,
  VectorMazeGameData,
} from '@/types/api'

const GameFinishSchema = z.object({
  gameId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = GameFinishSchema.parse(body)

    // Get game session
    const gameSession = await getVectorMazeSession(validatedData.gameId)

    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      )
    }

    const gameData = gameSession.session_data as any

    if (!gameData || !gameData.isActive) {
      return NextResponse.json(
        { error: 'Game is already finished' },
        { status: 400 }
      )
    }

    // Validate the complete word chain
    const difficultySettings = getDifficultySettings(gameData.difficulty)
    const wordChainValidation = await validateWordChain(
      gameData.startWord,
      gameData.intermediateWords || [],
      gameData.goalWord,
      difficultySettings.adjacencyTolerance
    )

    // Check if goal was reached
    const isSuccess =
      wordChainValidation.isValid &&
      isGoalReached(wordChainValidation, gameData.targetSimilarity)

    // Calculate final score
    const scoreResult = calculateFinalScore(
      gameData,
      isSuccess,
      wordChainValidation
    )

    // Calculate time elapsed
    const endTime = new Date()
    const startTime = new Date(gameData.startTime)
    const timeElapsed = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000
    )

    // Create complete word chain for response
    const wordChain = [
      gameData.startWord,
      ...(gameData.intermediateWords || []),
      gameData.goalWord,
    ]

    // Update game data to mark as finished
    const finishedGameData = {
      ...gameData,
      isActive: false,
      endTime: endTime.toISOString(),
    }

    // Update game session to mark as finished
    await updateVectorMazeSession(
      validatedData.gameId,
      finishedGameData,
      scoreResult.score
    )

    const response: GameFinishResponse = {
      finalScore: scoreResult.score,
      totalMoves: gameData.moves?.length || 0,
      timeElapsed: timeElapsed,
      isSuccess: scoreResult.isSuccess,
      wordChain: wordChain,
      similarities: wordChainValidation.similarities,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error finishing game:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
