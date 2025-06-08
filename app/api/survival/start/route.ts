import { NextRequest, NextResponse } from 'next/server'
import { startSurvivalGame } from '@/lib/survival-logic'

export async function POST(request: NextRequest) {
  console.log('🎯 [Survival Start] API呼び出し開始')

  try {
    // Start the survival game with system-generated base word
    console.log('🎯 [Survival Start] ゲーム開始処理中...')
    const gameState = await startSurvivalGame()

    console.log('🎯 [Survival Start] ゲーム開始成功:', {
      gameId: gameState.gameId,
      baseWord: gameState.currentBaseWord,
      stage: gameState.stage,
      lives: gameState.lives,
      score: gameState.score,
      difficulty: gameState.difficulty,
    })

    // Return game session information
    const response = {
      gameId: gameState.gameId,
      stage: gameState.stage,
      lives: gameState.lives,
      score: gameState.score,
      baseWord: gameState.currentBaseWord,
    }

    console.log('🎯 [Survival Start] レスポンス:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [Survival Start] エラー発生:', error)

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
