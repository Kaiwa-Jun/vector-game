# データベースセットアップガイド

## 前提条件

- Supabaseアカウント
- Node.js 18以上
- npm または yarn

## 1. Supabaseプロジェクトの作成

### 新規プロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. "New Project"をクリック
3. プロジェクト名: `vector-game`
4. リージョン: `ap-northeast-1` (東京)
5. データベースパスワードを設定

### プロジェクト情報の取得

作成後、以下の情報を控えておく：

- Project URL: `https://[project-id].supabase.co`
- API Key (anon): `eyJ...`
- API Key (service_role): `eyJ...`

## 2. pgvector拡張の有効化

Supabase SQL Editorで以下を実行：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 3. マイグレーションの実行

### 手動実行（推奨）

Supabase SQL Editorで以下のファイルを順番に実行：

1. `database/migrations/001_initial_schema.sql`
2. `database/migrations/002_create_indexes.sql`
3. `database/migrations/003_add_rls.sql`
4. `database/migrations/004_add_functions.sql`

### CLIを使用する場合

```bash
# Supabase CLIのインストール
npm install -g supabase

# プロジェクトの初期化
supabase init

# リモートプロジェクトとの連携
supabase link --project-ref [project-id]

# マイグレーションの実行
supabase db push
```

## 4. 環境変数の設定

### .env.local ファイルの作成

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Database Configuration
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# OpenAI Configuration (for vector embeddings)
OPENAI_API_KEY=[your-openai-api-key]

# Environment
NODE_ENV=development
```

## 5. 依存関係のインストール

```bash
npm install @supabase/supabase-js
```

## 6. サンプルデータの投入

Supabase SQL Editorで以下を実行：

```sql
-- database/seeds/sample_popular_words.sql の内容を実行
```

## 7. 接続テスト

### データベース接続の確認

```javascript
import { supabase } from './lib/supabase'

// テスト関数
async function testConnection() {
  const { data, error } = await supabase
    .from('popular_words')
    .select('*')
    .limit(1)

  if (error) {
    console.error('接続エラー:', error)
  } else {
    console.log('接続成功:', data)
  }
}

testConnection()
```

### pgvectorの動作確認

```sql
-- ベクトル検索のテスト
SELECT * FROM match_vectors(
  array_fill(0.1, ARRAY[1536])::vector(1536),
  0.5,
  5
);
```

## 8. パフォーマンス設定

### インデックスの最適化

```sql
-- ベクトルインデックスのパラメータ調整
SET ivfflat.probes = 10;
```

### 接続プールの設定

```javascript
// lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

## 9. セキュリティ設定

### RLSポリシーの確認

```sql
-- ポリシーの一覧表示
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### APIキーの管理

- 本番環境では環境変数を使用
- service_role キーは絶対にクライアントサイドで使用しない
- 定期的なキーローテーションを実施

## 10. バックアップ設定

### 自動バックアップの有効化

Supabase Dashboardの Settings > Database でバックアップを設定

### 手動バックアップ

```bash
# データベースダンプの作成
pg_dump "postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres" > backup.sql

# リストア
psql "postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres" < backup.sql
```

## トラブルシューティング

### よくある問題

#### 1. pgvector拡張が見つからない

```sql
-- 拡張の確認
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 手動インストール
CREATE EXTENSION vector;
```

#### 2. ベクトル検索が遅い

```sql
-- インデックスの確認
\d+ vectors

-- インデックスの再作成
DROP INDEX IF EXISTS vectors_embedding_idx;
CREATE INDEX vectors_embedding_idx ON vectors USING ivfflat (embedding vector_cosine_ops);
```

#### 3. 接続エラー

- 環境変数の確認
- ファイアウォール設定の確認
- APIキーの有効性確認

### ログの確認

```bash
# Supabase ログの確認
supabase logs --project-ref [project-id]
```

## 本番環境への移行

### 環境別設定

1. 本番用Supabaseプロジェクトの作成
2. 同じマイグレーションの実行
3. 環境変数の更新
4. DNS設定（カスタムドメイン使用時）

### パフォーマンス監視

- Supabase Dashboardでクエリパフォーマンスを監視
- ログ分析の設定
- アラート設定
