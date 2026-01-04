# AI Chat - プロジェクト仕様書

## プロジェクト概要

Anthropic Claude APIを活用した公開Webチャットボットアプリケーション。
シンプルで使いやすいインターフェースで、誰でも気軽にAIとの対話を楽しめるサービスを提供します。

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: カスタムコンポーネント（Tailwind CSS使用）
- **状態管理**: React Context API / Zustand（必要に応じて）

### バックエンド
- **API**: Next.js API Routes
- **言語**: TypeScript
- **AI/LLM**: Anthropic Claude API (Claude 3.5 Sonnet推奨)

### データベース
- **データベース**: MongoDB
- **ODM**: Mongoose
- **ホスティング**: MongoDB Atlas推奨

### インフラ・デプロイ
- **デプロイ先**: Google Cloud Run
- **コンテナ**: Docker
- **CI/CD**: GitHub Actions

## プロジェクトディレクトリ構造

```
ai-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── chat/          # チャット関連API
│   │   │   └── conversations/ # 会話履歴API
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx           # メインページ
│   ├── components/            # Reactコンポーネント
│   │   ├── chat/              # チャット関連コンポーネント
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── ConversationHistory.tsx
│   │   └── ui/                # 共通UIコンポーネント
│   ├── lib/                   # ユーティリティ・設定
│   │   ├── mongodb.ts         # MongoDB接続
│   │   ├── claude.ts          # Claude API クライアント
│   │   └── utils.ts           # ヘルパー関数
│   ├── models/                # Mongooseモデル
│   │   └── Conversation.ts    # 会話履歴モデル
│   └── types/                 # TypeScript型定義
│       └── index.ts
├── public/                    # 静的ファイル
├── tests/                     # テストファイル
│   ├── unit/                  # ユニットテスト
│   ├── integration/           # 統合テスト
│   └── e2e/                   # E2Eテスト
├── .env.local                 # 環境変数（ローカル）
├── .env.example               # 環境変数のサンプル
├── Dockerfile                 # Docker設定
├── docker-compose.yml         # ローカル開発用Docker Compose
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── CLAUDE.md                  # このファイル
```

## 主要機能

### 1. 基本チャット機能
- ユーザーがテキストメッセージを入力
- Claude APIに送信し、AIの応答を取得
- リアルタイムでストリーミング表示（可能であれば）
- マークダウン形式のレスポンスをレンダリング

### 2. 会話履歴
- MongoDBに会話履歴を保存
- 過去の会話をロード・閲覧可能
- 新しい会話の開始
- セッションIDによる会話の管理

### 3. UI/UX
- レスポンシブデザイン（モバイル対応）
- ダークモード対応（オプション）
- ローディングインジケーター
- エラーハンドリングとユーザーへのフィードバック

## データモデル

### Conversation（会話履歴）

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  _id: ObjectId;
  sessionId: string;           // セッション識別子（UUID）
  messages: Message[];         // 会話メッセージ配列
  createdAt: Date;
  updatedAt: Date;
  title?: string;              // 会話のタイトル（最初のメッセージから自動生成）
}
```

## API設計

### POST /api/chat
チャットメッセージを送信し、AIの応答を取得

**リクエスト**:
```json
{
  "message": "こんにちは",
  "sessionId": "uuid-v4-string",
  "conversationHistory": [
    { "role": "user", "content": "前のメッセージ" },
    { "role": "assistant", "content": "前の応答" }
  ]
}
```

**レスポンス**:
```json
{
  "response": "こんにちは！何かお手伝いできることはありますか？",
  "sessionId": "uuid-v4-string"
}
```

### GET /api/conversations
会話履歴一覧を取得

**クエリパラメータ**:
- `limit`: 取得件数（デフォルト: 10）
- `offset`: オフセット（ページネーション用）

**レスポンス**:
```json
{
  "conversations": [
    {
      "sessionId": "uuid",
      "title": "会話のタイトル",
      "createdAt": "2026-01-03T12:00:00Z",
      "messageCount": 5
    }
  ],
  "total": 25
}
```

### GET /api/conversations/[sessionId]
特定の会話履歴を取得

**レスポンス**:
```json
{
  "sessionId": "uuid",
  "messages": [
    { "role": "user", "content": "メッセージ", "timestamp": "2026-01-03T12:00:00Z" }
  ],
  "createdAt": "2026-01-03T12:00:00Z"
}
```

### DELETE /api/conversations/[sessionId]
会話履歴を削除

**レスポンス**:
```json
{
  "success": true
}
```

## 環境変数

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=your_api_key_here

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-chat?retryWrites=true&w=majority

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# オプション: セキュリティ
API_RATE_LIMIT_PER_MINUTE=10
```

## 開発ガイドライン

### コーディング規約

1. **TypeScript厳格モード**: `strict: true` を使用
2. **命名規則**:
   - コンポーネント: PascalCase (`ChatInterface.tsx`)
   - 関数・変数: camelCase (`getUserMessage`)
   - 定数: UPPER_SNAKE_CASE (`MAX_MESSAGE_LENGTH`)
3. **ファイル構成**:
   - 1ファイル1コンポーネント
   - ロジックとUIの分離
   - カスタムフックは `use` プレフィックス

### エラーハンドリング

- API呼び出しは必ず try-catch でラップ
- ユーザーにわかりやすいエラーメッセージを表示
- エラーログは適切に記録（本番環境では外部ログサービス使用推奨）

### セキュリティ

- API Keyはサーバーサイドでのみ使用（クライアントに露出させない）
- 入力値のバリデーション（最大文字数制限など）
- レート制限の実装（API乱用防止）
- CORS設定の適切な管理

## テスト戦略

### ユニットテスト
- **フレームワーク**: Jest + React Testing Library
- **対象**: ユーティリティ関数、カスタムフック
- **カバレッジ目標**: 80%以上

### 統合テスト
- **対象**: API Routes、データベース操作
- **ツール**: Jest + Supertest

### E2Eテスト
- **フレームワーク**: Playwright
- **対象**: 主要なユーザーフロー
  - 新規会話の開始
  - メッセージ送受信
  - 会話履歴の閲覧

### テスト実行コマンド
```bash
npm run test           # ユニットテスト
npm run test:watch     # 監視モード
npm run test:e2e       # E2Eテスト
npm run test:coverage  # カバレッジレポート
```

### テストコード品質基準（重要）

以下の基準を厳守してください：

1. **実際の機能を検証する**
   - `expect(true).toBe(true)` のような無意味なアサーションは禁止
   - 各テストケースは具体的な入力と期待される出力を検証すること

2. **ハードコーディング禁止**
   - テストを通すためだけのハードコードは絶対に禁止
   - 本番コードに `if (testMode)` のような条件分岐を入れない
   - テスト用のマジックナンバーを本番コードに埋め込まない

3. **包括的なテスト**
   - 正常系だけでなく、境界値、異常系、エラーケースも必ずテスト
   - カバレッジだけでなく、実際の品質を重視

4. **TDD（推奨）**
   - テストが失敗する状態から始める（Red-Green-Refactor）
   - 仕様を正しく理解してからテストを書く

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、必要な値を設定

```bash
cp .env.example .env.local
```

### 3. MongoDB接続確認

MongoDB Atlasでクラスターを作成し、接続文字列を取得

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセス

### 5. Docker での起動（オプション）

```bash
docker-compose up
```

## デプロイメント（Google Cloud Run）

### 1. Dockerイメージのビルド

```bash
docker build -t ai-chat:latest .
```

### 2. Google Container Registryにプッシュ

```bash
# GCPプロジェクトIDを設定
export PROJECT_ID=your-gcp-project-id

# イメージにタグ付け
docker tag ai-chat:latest gcr.io/$PROJECT_ID/ai-chat:latest

# プッシュ
docker push gcr.io/$PROJECT_ID/ai-chat:latest
```

### 3. Cloud Runにデプロイ

```bash
gcloud run deploy ai-chat \
  --image gcr.io/$PROJECT_ID/ai-chat:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY,MONGODB_URI=$MONGODB_URI
```

### 4. CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` を作成し、自動デプロイを設定

## パフォーマンス最適化

- Claude APIのストリーミングレスポンス活用
- 会話履歴のページネーション
- 画像の最適化（Next.js Image コンポーネント使用）
- クライアントサイドのキャッシング（React Query推奨）

## 今後の拡張案（オプション）

- ユーザー認証機能（Firebase Auth / Auth0）
- 会話の共有機能
- マルチモーダル対応（画像アップロード）
- カスタムプロンプト設定
- 複数のAIモデル対応（Claude、GPT-4など切り替え）
- 音声入力/出力
- PWA化（オフライン対応）

## 開発時の注意事項

1. **API使用量の管理**: Claude APIは従量課金のため、開発中もコスト管理に注意
2. **レート制限**: Anthropic APIのレート制限を考慮した実装
3. **エラーハンドリング**: ネットワークエラー、APIエラーを適切に処理
4. **データプライバシー**: 会話データの取り扱いに注意（将来的にプライバシーポリシー必要）
5. **スケーラビリティ**: 公開サービスのため、負荷に耐えられる設計を意識

## サポート・問い合わせ

開発中の質問や問題があれば、以下を参照：
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Anthropic API ドキュメント](https://docs.anthropic.com/)
- [MongoDB ドキュメント](https://docs.mongodb.com/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)

## ライセンス

（プロジェクトのライセンスを記載）

---

最終更新: 2026-01-03
