-- ベクトル検索用のRPC関数を作成
CREATE OR REPLACE FUNCTION match_vectors(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  word text,
  embedding vector(1536),
  created_at timestamp,
  updated_at timestamp,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    vectors.id,
    vectors.word,
    vectors.embedding,
    vectors.created_at,
    vectors.updated_at,
    1 - (vectors.embedding <=> query_embedding) AS similarity
  FROM vectors
  WHERE 1 - (vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY vectors.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 使用回数を増加させるRPC関数を作成
CREATE OR REPLACE FUNCTION increment_word_usage(base_word text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE popular_words 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE popular_words.base_word = increment_word_usage.base_word;
$$; 
