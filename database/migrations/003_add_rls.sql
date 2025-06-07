-- Row Level Security の有効化
ALTER TABLE vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー
CREATE POLICY "Allow read access" ON vectors FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON word_similarities FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON popular_words FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON game_sessions FOR SELECT USING (true); 
