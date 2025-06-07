-- インデックス作成
CREATE INDEX ON vectors USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_word_similarities_words ON word_similarities(word1, word2);
CREATE INDEX idx_popular_words_base ON popular_words(base_word);
CREATE INDEX idx_popular_words_usage ON popular_words(usage_count DESC);
CREATE INDEX idx_game_sessions_type ON game_sessions(game_type);
CREATE INDEX idx_game_sessions_created ON game_sessions(created_at); 
