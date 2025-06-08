export interface GameStartRequest {
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface GameStartResponse {
  gameId: string
  startWord: string
  goalWord: string
  targetSimilarity: number
  requiredIntermediateWords: number
  maxMoves: number
  timeLimit: number
  adjacencyTolerance: number
}

export interface SimilarityRequest {
  gameId: string
  inputWord: string
  targetWord: string
}

export interface SimilarityResponse {
  similarity: number
  isGoalReached: boolean
  score: number
}

export interface IntermediateWordRequest {
  gameId: string
  word: string
  position: number
}

export interface IntermediateWordResponse {
  isValid: boolean
  similarity?: number
  message?: string
  isComplete: boolean
  chainValidation?: {
    isValid: boolean
    similarities?: number[]
    message?: string
  }
}

export interface GameFinishRequest {
  gameId: string
}

export interface GameFinishResponse {
  finalScore: number
  totalMoves: number
  timeElapsed: number
  isSuccess: boolean
  wordChain?: string[]
  similarities?: number[]
}

export interface VectorData {
  word: string
  embedding: number[]
  createdAt: Date
}

export interface VectorMazeGameData {
  startWord: string
  goalWord: string
  targetSimilarity: number
  requiredIntermediateWords: number
  intermediateWords: string[]
  moves: string[]
  isActive: boolean
  startTime: string
  endTime?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GameSession {
  id: string
  game_type: string
  score: number | null
  session_data: VectorMazeGameData
  created_at: string | null
  updated_at: string | null
}
