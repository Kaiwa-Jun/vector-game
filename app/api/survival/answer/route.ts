import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { processSurvivalAnswer } from '@/lib/survival-logic'

const AnswerRequestSchema = z.object({
  gameId: z.string().uuid(),
  selectedWord: z.string().min(1).max(50),
})

export async function POST(request: NextRequest) {
  console.log('🎯 [Survival Answer] API呼び出し開始')

  try {
    const body = await request.json()
    console.log('🎯 [Survival Answer] リクエストボディ:', body)

    const validatedData = AnswerRequestSchema.parse(body)
    console.log('🎯 [Survival Answer] バリデーション成功:', validatedData)

    // Process the answer
    console.log('🎯 [Survival Answer] 回答処理開始...', {
      gameId: validatedData.gameId,
      selectedWord: validatedData.selectedWord,
    })

    const result = await processSurvivalAnswer(
      validatedData.gameId,
      validatedData.selectedWord
    )

    console.log('🎯 [Survival Answer] 回答処理完了:', {
      isCorrect: result.isCorrect,
      score: result.score,
      lives: result.lives,
      stage: result.stage,
      isGameOver: result.isGameOver,
      gameOverReason: result.gameOverReason,
      correctAnswer: result.correctAnswer,
    })

    const response = {
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      score: result.score,
      lives: result.lives,
      stage: result.stage,
      isGameOver: result.isGameOver,
      gameOverReason: result.gameOverReason,
    }

    console.log('🎯 [Survival Answer] レスポンス:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [Survival Answer] エラー発生:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: (error as any)?.message },
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
