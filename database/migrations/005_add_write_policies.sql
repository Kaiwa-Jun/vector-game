-- 書き込み許可ポリシーの追加

-- ゲームセッションの作成・更新を許可
CREATE POLICY "Allow insert on game_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on game_sessions" ON game_sessions FOR UPDATE USING (true);

-- ベクターデータの作成を許可（新しい単語の追加用）
CREATE POLICY "Allow insert on vectors" ON vectors FOR INSERT WITH CHECK (true);

-- 単語類似度キャッシュの作成・更新を許可
CREATE POLICY "Allow insert on word_similarities" ON word_similarities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on word_similarities" ON word_similarities FOR UPDATE USING (true);

-- 人気語の使用回数更新を許可
CREATE POLICY "Allow update on popular_words" ON popular_words FOR UPDATE USING (true);