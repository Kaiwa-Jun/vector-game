# データベーススキーマ設計書

## 概要

ベクトル連想ゲーム用のデータベーススキーマです。PostgreSQL + pgvectorを使用してベクトル検索機能を実装しています。

## テーブル構成

### 1. vectors テーブル

単語とそのベクトル表現を格納するメインテーブル

| カラム名   | データ型     | 制約            | 説明                   |
| ---------- | ------------ | --------------- | ---------------------- |
| id         | UUID         | PRIMARY KEY     | 一意識別子             |
| word       | TEXT         | UNIQUE NOT NULL | 単語                   |
| embedding  | VECTOR(1536) | NOT NULL        | OpenAI埋め込みベクトル |
| created_at | TIMESTAMP    | DEFAULT NOW()   | 作成日時               |
| updated_at | TIMESTAMP    | DEFAULT NOW()   | 更新日時               |

**インデックス:**

- `ivfflat (embedding vector_cosine_ops)` - ベクトル検索用

### 2. word_similarities テーブル

単語間の類似度をキャッシュするテーブル

| カラム名         | データ型  | 制約          | 説明               |
| ---------------- | --------- | ------------- | ------------------ |
| id               | UUID      | PRIMARY KEY   | 一意識別子         |
| word1            | TEXT      | NOT NULL      | 単語1              |
| word2            | TEXT      | NOT NULL      | 単語2              |
| similarity_score | FLOAT     | NOT NULL      | 類似度スコア (0-1) |
| created_at       | TIMESTAMP | DEFAULT NOW() | 作成日時           |

**制約:**

- `UNIQUE(word1, word2)` - 単語ペアの重複防止

**インデックス:**

- `idx_word_similarities_words (word1, word2)` - 検索用

### 3. popular_words テーブル

人気語と関連語を事前計算して格納するテーブル

| カラム名         | データ型  | 制約            | 説明               |
| ---------------- | --------- | --------------- | ------------------ |
| id               | UUID      | PRIMARY KEY     | 一意識別子         |
| base_word        | TEXT      | UNIQUE NOT NULL | 基準単語           |
| similar_words    | JSONB     | NOT NULL        | 類似語リスト       |
| trap_candidates  | JSONB     | NOT NULL        | トラップ候補リスト |
| difficulty_level | INTEGER   | DEFAULT 1       | 難易度レベル (1-3) |
| usage_count      | INTEGER   | DEFAULT 0       | 使用回数           |
| created_at       | TIMESTAMP | DEFAULT NOW()   | 作成日時           |
| updated_at       | TIMESTAMP | DEFAULT NOW()   | 更新日時           |

**インデックス:**

- `idx_popular_words_base (base_word)` - 基準単語検索用
- `idx_popular_words_usage (usage_count DESC)` - 人気順ソート用

### 4. game_sessions テーブル

ゲームセッション情報を格納するテーブル

| カラム名      | データ型  | 制約          | 説明                 |
| ------------- | --------- | ------------- | -------------------- |
| id            | UUID      | PRIMARY KEY   | 一意識別子           |
| game_type     | TEXT      | NOT NULL      | ゲームタイプ         |
| current_stage | INTEGER   | DEFAULT 1     | 現在のステージ       |
| score         | INTEGER   | DEFAULT 0     | スコア               |
| lives         | INTEGER   | DEFAULT 3     | 残りライフ           |
| session_data  | JSONB     |               | セッション固有データ |
| created_at    | TIMESTAMP | DEFAULT NOW() | 作成日時             |
| updated_at    | TIMESTAMP | DEFAULT NOW() | 更新日時             |

**インデックス:**

- `idx_game_sessions_type (game_type)` - ゲームタイプ検索用
- `idx_game_sessions_created (created_at)` - 作成日時ソート用

## RPC関数

### match_vectors

ベクトル類似検索を実行する関数

```sql
match_vectors(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
```

**パラメータ:**

- `query_embedding`: 検索クエリのベクトル
- `match_threshold`: 類似度の閾値 (0-1)
- `match_count`: 返す結果の最大数

**戻り値:**

- vectors テーブルの全カラム + similarity スコア

### increment_word_usage

人気語の使用回数を増加させる関数

```sql
increment_word_usage(base_word text)
```

**パラメータ:**

- `base_word`: 使用回数を増加させる基準単語

## セキュリティ設定

### Row Level Security (RLS)

全テーブルでRLSが有効化されており、読み取り専用ポリシーが設定されています。

```sql
CREATE POLICY "Allow read access" ON [table_name] FOR SELECT USING (true);
```

## パフォーマンス最適化

### ベクトル検索

- IVFFlat インデックスを使用してベクトル検索を高速化
- コサイン類似度 (`vector_cosine_ops`) を使用

### キャッシュ戦略

- `word_similarities` テーブルで類似度計算結果をキャッシュ
- `popular_words` テーブルで頻繁に使用される単語の関連語を事前計算

## 使用例

### ベクトル検索

```sql
SELECT * FROM match_vectors(
  '[0.1, 0.2, ...]'::vector(1536),
  0.8,
  5
);
```

### 人気語取得

```sql
SELECT * FROM popular_words
ORDER BY usage_count DESC
LIMIT 10;
```
