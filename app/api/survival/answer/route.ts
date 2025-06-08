import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { processSurvivalAnswer } from '@/lib/survival-logic'

// Request validation schema
const AnswerSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  selectedWord: z
    .string()
    .min(1, 'Selected word is required')
    .max(50, 'Selected word too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const result = AnswerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    const { gameId, selectedWord } = result.data

    // Process the answer
    const answerResult = await processSurvivalAnswer(gameId, selectedWord)

    // Return result
    return NextResponse.json({
      isCorrect: answerResult.isCorrect,
      correctAnswer: answerResult.correctAnswer,
      score: answerResult.score,
      lives: answerResult.lives,
      stage: answerResult.stage,
      isGameOver: answerResult.isGameOver,
      gameOverReason: answerResult.gameOverReason,
    })
  } catch (error) {
    console.error('Error processing survival answer:', error)

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
