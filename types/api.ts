export interface GameStartRequest {
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameStartResponse {
  gameId: string;
  startWord: string;
  goalWord: string;
  targetSimilarity: number;
}

export interface SimilarityRequest {
  gameId: string;
  inputWord: string;
  targetWord: string;
}

export interface SimilarityResponse {
  similarity: number;
  isGoalReached: boolean;
  score: number;
}

export interface GameFinishRequest {
  gameId: string;
}

export interface GameFinishResponse {
  finalScore: number;
  totalMoves: number;
  timeElapsed: number;
  isSuccess: boolean;
}

export interface VectorData {
  word: string;
  embedding: number[];
  createdAt: Date;
}

export interface VectorMazeGameData {
  startWord: string;
  goalWord: string;
  targetSimilarity: number;
  moves: string[];
  isActive: boolean;
  startTime: string;
  endTime?: string;
}

export interface GameSession {
  id: string;
  game_type: string;
  score: number | null;
  session_data: VectorMazeGameData;
  created_at: string | null;
  updated_at: string | null;
}