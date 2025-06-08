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
  try {
    const body = await request.json()
    const validatedData = IntermediateWordSchema.parse(body)

    // Get current game session
    const gameSession = await getVectorMazeSession(validatedData.gameId)
    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      )
    }

    const gameData = gameSession.session_data as any
    if (!gameData || !gameData.isActive) {
      return NextResponse.json({ error: 'Game is not active' }, { status: 400 })
    }

    // Validate position
    if (validatedData.position >= gameData.requiredIntermediateWords) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
    }

    // Get previous word (either start word or previous intermediate word)
    const previousWord =
      validatedData.position === 0
        ? gameData.startWord
        : gameData.intermediateWords[validatedData.position - 1]

    if (!previousWord) {
      return NextResponse.json(
        { error: 'Previous word not found' },
        { status: 400 }
      )
    }

    // Validate the intermediate word
    const validation = await validateIntermediateWord(
      previousWord,
      validatedData.word
    )

    if (!validation.isValid) {
      const response: IntermediateWordResponse = {
        isValid: false,
        message: validation.message,
        isComplete: false,
      }
      return NextResponse.json(response)
    }

    // Update intermediate words array
    const newIntermediateWords = [...gameData.intermediateWords]
    newIntermediateWords[validatedData.position] = validatedData.word

    // Check if all intermediate words are filled
    const isComplete =
      newIntermediateWords.length === gameData.requiredIntermediateWords &&
      newIntermediateWords.every(word => word && word.trim().length > 0)

    let chainValidation = undefined

    if (isComplete) {
      // Validate the complete word chain
      const difficultySettings = getDifficultySettings(gameData.difficulty)
      chainValidation = await validateWordChain(
        gameData.startWord,
        newIntermediateWords,
        gameData.goalWord,
        difficultySettings.adjacencyTolerance
      )
    }

    // Update game session
    const updatedGameData = {
      ...gameData,
      intermediateWords: newIntermediateWords,
      moves: [...gameData.moves, validatedData.word],
    }

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

    return NextResponse.json(response)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing intermediate word:', error)
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
