import { NextRequest, NextResponse } from 'next/server'
import { startSurvivalGame } from '@/lib/survival-logic'

export async function POST(request: NextRequest) {
  try {
    // Start the survival game with system-generated base word
    const gameState = await startSurvivalGame()

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
