-- pgvector拡張の有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- ベクトルデータテーブル
CREATE TABLE vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 類似度キャッシュテーブル
CREATE TABLE word_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word1 TEXT NOT NULL,
  word2 TEXT NOT NULL,
  similarity_score FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(word1, word2)
);

-- 人気語の事前計算テーブル
CREATE TABLE popular_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_word TEXT UNIQUE NOT NULL,
  similar_words JSONB NOT NULL,
  trap_candidates JSONB NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ゲームセッションテーブル
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL,
  current_stage INTEGER DEFAULT 1,
  score INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 3,
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
); 
