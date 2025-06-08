import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  validateIntermediateWord,
  validateWordChain,
  getDifficultySettings,
} from '@/lib/game-logic'
import { getVectorMazeSession, updateVectorMazeSession } from '@/lib/supabase'
import { IntermediateWordRequest, IntermediateWordResponse } from '@/types/api'

const IntermediateWordSchema = z.object({
  gameId: z.string().uuid(),
  word: z.string().min(1).max(50),
  position: z.number().int().min(0),
})

export async function POST(request: NextRequest) {
  console.log('🎮 [Vector Maze Intermediate] API呼び出し開始')

  try {
    const body = await request.json()
    console.log('🎮 [Vector Maze Intermediate] リクエストボディ:', body)

    const validatedData = IntermediateWordSchema.parse(body)
    console.log(
      '🎮 [Vector Maze Intermediate] バリデーション成功:',
      validatedData
    )

    // Get current game session
    console.log('🎮 [Vector Maze Intermediate] ゲームセッション取得中...', {
      gameId: validatedData.gameId,
    })

    const gameSession = await getVectorMazeSession(validatedData.gameId)
    if (!gameSession) {
      console.error(
        '❌ [Vector Maze Intermediate] ゲームセッションが見つかりません'
      )
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      )
    }

    const gameData = gameSession.session_data as any
    if (!gameData || !gameData.isActive) {
      console.error('❌ [Vector Maze Intermediate] ゲームが非アクティブです')
      return NextResponse.json({ error: 'Game is not active' }, { status: 400 })
    }

    console.log('🎮 [Vector Maze Intermediate] 現在のゲーム状態:', {
      startWord: gameData.startWord,
      goalWord: gameData.goalWord,
      currentIntermediateWords: gameData.intermediateWords,
      requiredIntermediateWords: gameData.requiredIntermediateWords,
      difficulty: gameData.difficulty,
    })

    // Validate position
    if (validatedData.position >= gameData.requiredIntermediateWords) {
      console.error('❌ [Vector Maze Intermediate] 無効なポジション:', {
        position: validatedData.position,
        required: gameData.requiredIntermediateWords,
      })
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
    }

    // Get previous word (either start word or previous intermediate word)
    const previousWord =
      validatedData.position === 0
        ? gameData.startWord
        : gameData.intermediateWords[validatedData.position - 1]

    if (!previousWord) {
      console.error('❌ [Vector Maze Intermediate] 前の単語が見つかりません:', {
        position: validatedData.position,
        intermediateWords: gameData.intermediateWords,
      })
      return NextResponse.json(
        { error: 'Previous word not found' },
        { status: 400 }
      )
    }

    console.log('🎮 [Vector Maze Intermediate] 中間語検証開始:', {
      previousWord,
      inputWord: validatedData.word,
      position: validatedData.position,
    })

    // Validate the intermediate word
    const validation = await validateIntermediateWord(
      previousWord,
      validatedData.word
    )

    console.log('🎮 [Vector Maze Intermediate] 中間語検証結果:', validation)

    if (!validation.isValid) {
      const response: IntermediateWordResponse = {
        isValid: false,
        message: validation.message,
        isComplete: false,
      }
      console.log('🎮 [Vector Maze Intermediate] 検証失敗レスポンス:', response)
      return NextResponse.json(response)
    }

    // Update intermediate words array
    const newIntermediateWords = [...gameData.intermediateWords]
    newIntermediateWords[validatedData.position] = validatedData.word

    console.log('🎮 [Vector Maze Intermediate] 中間語配列更新:', {
      before: gameData.intermediateWords,
      after: newIntermediateWords,
    })

    // Check if all intermediate words are filled
    const isComplete =
      newIntermediateWords.length === gameData.requiredIntermediateWords &&
      newIntermediateWords.every(word => word && word.trim().length > 0)

    console.log('🎮 [Vector Maze Intermediate] 完了チェック:', {
      isComplete,
      currentLength: newIntermediateWords.length,
      required: gameData.requiredIntermediateWords,
      allFilled: newIntermediateWords.every(
        word => word && word.trim().length > 0
      ),
    })

    let chainValidation = undefined

    if (isComplete) {
      // Validate the complete word chain
      console.log('🎮 [Vector Maze Intermediate] 完全チェーン検証開始...')
      const difficultySettings = getDifficultySettings(gameData.difficulty)
      chainValidation = await validateWordChain(
        gameData.startWord,
        newIntermediateWords,
        gameData.goalWord,
        difficultySettings.adjacencyTolerance
      )

      console.log(
        '🎮 [Vector Maze Intermediate] 完全チェーン検証結果:',
        chainValidation
      )
    }

    // Update game session
    const updatedGameData = {
      ...gameData,
      intermediateWords: newIntermediateWords,
      moves: [...gameData.moves, validatedData.word],
    }

    console.log('🎮 [Vector Maze Intermediate] ゲームセッション更新中...')
    await updateVectorMazeSession(validatedData.gameId, updatedGameData)

    const response: IntermediateWordResponse = {
      isValid: true,
      similarity: validation.similarity,
      isComplete,
      chainValidation: chainValidation
        ? {
            isValid: chainValidation.isValid,
            similarities: chainValidation.similarities,
            message: chainValidation.message,
          }
        : undefined,
    }

    console.log('🎮 [Vector Maze Intermediate] 成功レスポンス:', response)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ [Vector Maze Intermediate] エラー発生:', error)

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
