import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { startSurvivalGame } from '@/lib/survival-logic'

// Request validation schema
const StartGameSchema = z.object({
  baseWord: z
    .string()
    .min(1, 'Base word is required')
    .max(50, 'Base word too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const result = StartGameSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    const { baseWord } = result.data

    // Start the survival game
    const gameState = await startSurvivalGame(baseWord)

    // Return game session information
    return NextResponse.json({
      gameId: gameState.gameId,
      stage: gameState.stage,
      lives: gameState.lives,
      score: gameState.score,
      baseWord: gameState.currentBaseWord,
    })
  } catch (error) {
    console.error('Error starting survival game:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
