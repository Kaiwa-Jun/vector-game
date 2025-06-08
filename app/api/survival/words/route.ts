import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateSurvivalRound } from '@/lib/survival-logic'

// Request validation schema
const WordsRequestSchema = z.object({
  gameId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  console.log('🎯 [Survival Words] API呼び出し開始')

  try {
    const body = await request.json()
    console.log('🎯 [Survival Words] リクエストボディ:', body)

    const validatedData = WordsRequestSchema.parse(body)
    console.log('🎯 [Survival Words] バリデーション成功:', validatedData)

    // Generate round choices
    console.log('🎯 [Survival Words] 選択肢生成開始...')
    const round = await generateSurvivalRound(validatedData.gameId)

    console.log('🎯 [Survival Words] 選択肢生成成功:', {
      baseWord: round.baseWord,
      choicesCount: round.choices.length,
      correctAnswers: round.choices.filter(c => c.isCorrect).length,
      trapAnswers: round.choices.filter(c => !c.isCorrect).length,
      stage: round.stage,
      lives: round.lives,
      score: round.score,
    })

    console.log(
      '🎯 [Survival Words] 生成された選択肢:',
      round.choices.map(choice => ({
        word: choice.word,
        isCorrect: choice.isCorrect,
      }))
    )

    const response = {
      baseWord: round.baseWord,
      choices: round.choices.map(choice => ({ word: choice.word })), // Hide isCorrect from client
      stage: round.stage,
      lives: round.lives,
      score: round.score,
    }

    console.log('🎯 [Survival Words] レスポンス:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [Survival Words] エラー発生:', error)

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
