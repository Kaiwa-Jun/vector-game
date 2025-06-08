import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateWordPair, getDifficultySettings } from '@/lib/game-logic'
import { createVectorMazeSession } from '@/lib/supabase'
import {
  GameStartRequest,
  GameStartResponse,
  VectorMazeGameData,
} from '@/types/api'

const GameStartSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
})

export async function POST(request: NextRequest) {
  console.log('🎮 [Vector Maze Start] API呼び出し開始')

  try {
    const body = await request.json()
    console.log('🎮 [Vector Maze Start] リクエストボディ:', body)

    const validatedData = GameStartSchema.parse(body)
    console.log('🎮 [Vector Maze Start] バリデーション成功:', validatedData)

    // Generate word pair based on difficulty
    console.log('🎮 [Vector Maze Start] 単語ペア生成開始...', {
      difficulty: validatedData.difficulty,
    })

    const wordPair = await generateWordPair(validatedData.difficulty)
    const difficultySettings = getDifficultySettings(validatedData.difficulty)

    console.log('🎮 [Vector Maze Start] 単語ペア生成成功:', {
      startWord: wordPair.startWord,
      goalWord: wordPair.goalWord,
      targetSimilarity: wordPair.targetSimilarity,
      requiredIntermediateWords: wordPair.requiredIntermediateWords,
    })

    console.log('🎮 [Vector Maze Start] 難易度設定:', difficultySettings)

    // Create game session data
    const gameData: VectorMazeGameData = {
      startWord: wordPair.startWord,
      goalWord: wordPair.goalWord,
      targetSimilarity: wordPair.targetSimilarity,
      requiredIntermediateWords: wordPair.requiredIntermediateWords,
      intermediateWords: [], // Array to store player's intermediate words
      moves: [],
      isActive: true,
      startTime: new Date().toISOString(),
      difficulty: validatedData.difficulty,
    }

    // Create game session
    console.log('🎮 [Vector Maze Start] ゲームセッション作成中...')
    const gameSession = await createVectorMazeSession(gameData)

    console.log('🎮 [Vector Maze Start] ゲームセッション作成成功:', {
      gameId: gameSession.id,
    })

    const response: GameStartResponse = {
      gameId: gameSession.id,
      startWord: wordPair.startWord,
      goalWord: wordPair.goalWord,
      targetSimilarity: wordPair.targetSimilarity,
      requiredIntermediateWords: wordPair.requiredIntermediateWords,
      maxMoves: difficultySettings.maxMoves,
      timeLimit: difficultySettings.timeLimit,
      adjacencyTolerance: difficultySettings.adjacencyTolerance,
    }

    console.log('🎮 [Vector Maze Start] レスポンス:', response)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ [Vector Maze Start] エラー発生:', error)

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
