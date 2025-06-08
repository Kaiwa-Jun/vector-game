import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateFinalScore } from '@/lib/game-logic'
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

    const gameData = gameSession.session_data as unknown as VectorMazeGameData
    if (!gameData.isActive) {
      return NextResponse.json(
        { error: 'Game is already finished' },
        { status: 400 }
      )
    }

    // Check if goal was reached (game completed successfully)
    const moves = gameData.moves || []
    const isSuccess = !gameData.isActive || gameData.endTime !== undefined

    // Calculate final score
    const scoreResult = calculateFinalScore(gameData, isSuccess)

    // Calculate time elapsed
    const endTime = new Date()
    const startTime = new Date(gameData.startTime)
    const timeElapsed = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000
    )

    // Update game data to mark as finished
    const finishedGameData: VectorMazeGameData = {
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
      totalMoves: moves.length,
      timeElapsed: timeElapsed,
      isSuccess: scoreResult.isSuccess,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error finishing game:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
