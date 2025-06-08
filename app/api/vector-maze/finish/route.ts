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
  console.log('🎮 [Vector Maze Finish] API呼び出し開始')

  try {
    const body = await request.json()
    console.log('🎮 [Vector Maze Finish] リクエストボディ:', body)

    const validatedData = GameFinishSchema.parse(body)
    console.log('🎮 [Vector Maze Finish] バリデーション成功:', validatedData)

    // Get game session
    console.log('🎮 [Vector Maze Finish] ゲームセッション取得中...', {
      gameId: validatedData.gameId,
    })

    const gameSession = await getVectorMazeSession(validatedData.gameId)

    if (!gameSession) {
      console.error('❌ [Vector Maze Finish] ゲームセッションが見つかりません')
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      )
    }

    const gameData = gameSession.session_data as any

    if (!gameData || !gameData.isActive) {
      console.error('❌ [Vector Maze Finish] ゲームが既に終了しています')
      return NextResponse.json(
        { error: 'Game is already finished' },
        { status: 400 }
      )
    }

    console.log('🎮 [Vector Maze Finish] 現在のゲーム状態:', {
      startWord: gameData.startWord,
      goalWord: gameData.goalWord,
      intermediateWords: gameData.intermediateWords,
      targetSimilarity: gameData.targetSimilarity,
      difficulty: gameData.difficulty,
      moves: gameData.moves,
    })

    // Validate the complete word chain
    console.log('🎮 [Vector Maze Finish] ワードチェーン検証開始...')
    const difficultySettings = getDifficultySettings(gameData.difficulty)
    const wordChainValidation = await validateWordChain(
      gameData.startWord,
      gameData.intermediateWords || [],
      gameData.goalWord,
      difficultySettings.adjacencyTolerance
    )

    console.log(
      '🎮 [Vector Maze Finish] ワードチェーン検証結果:',
      wordChainValidation
    )

    // Check if goal was reached
    const isSuccess =
      wordChainValidation.isValid &&
      isGoalReached(wordChainValidation, gameData.targetSimilarity)

    console.log('🎮 [Vector Maze Finish] ゴール判定:', {
      chainValid: wordChainValidation.isValid,
      goalReached: isGoalReached(
        wordChainValidation,
        gameData.targetSimilarity
      ),
      finalSuccess: isSuccess,
      targetSimilarity: gameData.targetSimilarity,
      finalSimilarity:
        wordChainValidation.similarities?.[
          wordChainValidation.similarities.length - 1
        ],
    })

    // Calculate final score
    console.log('🎮 [Vector Maze Finish] スコア計算開始...')
    const scoreResult = calculateFinalScore(
      gameData,
      isSuccess,
      wordChainValidation
    )

    console.log('🎮 [Vector Maze Finish] スコア計算結果:', scoreResult)

    // Calculate time elapsed
    const endTime = new Date()
    const startTime = new Date(gameData.startTime)
    const timeElapsed = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000
    )

    console.log('🎮 [Vector Maze Finish] 時間計算:', {
      startTime: gameData.startTime,
      endTime: endTime.toISOString(),
      timeElapsed,
    })

    // Create complete word chain for response
    const wordChain = [
      gameData.startWord,
      ...(gameData.intermediateWords || []),
      gameData.goalWord,
    ]

    console.log('🎮 [Vector Maze Finish] 完全ワードチェーン:', wordChain)

    // Update game data to mark as finished
    const finishedGameData = {
      ...gameData,
      isActive: false,
      endTime: endTime.toISOString(),
    }

    // Update game session to mark as finished
    console.log('🎮 [Vector Maze Finish] ゲームセッション更新中...')
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

    console.log('🎮 [Vector Maze Finish] 最終レスポンス:', response)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ [Vector Maze Finish] エラー発生:', error)

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
