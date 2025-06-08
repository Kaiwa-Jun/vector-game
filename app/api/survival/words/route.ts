import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateSurvivalRound } from '@/lib/survival-logic'

// Request validation schema
const GetWordsSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const result = GetWordsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    const { gameId } = result.data

    // Generate round with choices
    const round = await generateSurvivalRound(gameId)

    // Transform choices to hide correct answer information from client
    const choices = round.choices.map(choice => ({
      word: choice.word,
      // Don't include isCorrect in the response
    }))

    // Return choices and game state
    return NextResponse.json({
      choices,
      stage: round.stage,
      lives: round.lives,
      score: round.score,
      baseWord: round.baseWord,
    })
  } catch (error) {
    console.error('Error generating survival round:', error)

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Game not found')) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }

      if (error.message.includes('already over')) {
        return NextResponse.json(
          { error: 'Game is already over' },
          { status: 400 }
        )
      }

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
