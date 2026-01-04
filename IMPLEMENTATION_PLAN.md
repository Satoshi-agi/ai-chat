# AI Chat アプリケーション 実装計画

## Phase 1: プロジェクト基盤セットアップ

### 1.1 Next.js プロジェクト初期化
- [x] Next.js (App Router) プロジェクトを作成
- [x] TypeScript設定（strict mode有効化）
- [x] 必要なパッケージのインストール
  - `@anthropic-ai/sdk`
  - `mongoose`
  - `tailwindcss`
  - `uuid`
  - 開発依存関係（Jest, Testing Library, Playwrightなど）

### 1.2 プロジェクト構造作成
- [x] ディレクトリ構造を作成
  ```
  src/
  ├── app/
  ├── components/
  ├── lib/
  ├── models/
  └── types/
  tests/
  ├── unit/
  ├── integration/
  └── e2e/
  ```

### 1.3 環境設定
- [x] `.env.example` ファイルを作成
- [x] `.env.local` ファイルを作成（gitignore対象）
- [x] `.gitignore` の設定
- [x] Tailwind CSS設定ファイル作成

---

## Phase 2: バックエンド基盤

### 2.1 データベース設定
- [x] MongoDB接続ユーティリティ作成 (`src/lib/mongodb.ts`)
- [x] 接続テストの実装
- [x] エラーハンドリング実装

### 2.2 データモデル実装
- [x] Conversationモデルの定義 (`src/models/Conversation.ts`)
  - sessionId（UUID、インデックス付き）
  - messages配列（role, content, timestamp）
  - createdAt, updatedAt
  - title（オプション）
- [x] Mongooseスキーマバリデーション実装

### 2.3 Claude API クライアント
- [x] Claude APIクライアント作成 (`src/lib/claude.ts`)
- [x] メッセージ送信機能
- [x] ストリーミングレスポンス対応（可能であれば）
- [x] エラーハンドリング（レート制限、APIエラー）
- [x] リトライロジック実装

### 2.4 TypeScript型定義
- [x] 共通型定義ファイル作成 (`src/types/index.ts`)
  - Message型
  - Conversation型
  - API Request/Response型

---

## Phase 3: API Routes実装

### 3.1 チャットAPI
- [x] `POST /api/chat` エンドポイント実装
  - リクエストバリデーション
  - Claude APIへのメッセージ送信
  - 会話履歴の保存
  - エラーハンドリング
  - レート制限実装
- [x] ユニットテスト作成

### 3.2 会話履歴API
- [x] `GET /api/conversations` エンドポイント実装
  - ページネーション対応
  - ソート（最新順）
- [x] `GET /api/conversations/[sessionId]` エンドポイント実装
  - 特定会話の取得
  - 存在チェック
- [x] `DELETE /api/conversations/[sessionId]` エンドポイント実装
  - 削除処理
  - エラーハンドリング
- [x] 統合テスト作成

---

## Phase 4: フロントエンド実装

### 4.1 UIコンポーネント（共通）
- [x] レイアウトコンポーネント (`src/app/layout.tsx`)
  - メタデータ設定
  - Tailwind CSS適用
  - フォント設定
- [x] ローディングインジケーターコンポーネント
- [x] エラー表示コンポーネント
- [x] ボタン、入力フィールドなど基本UIコンポーネント

### 4.2 チャット機能コンポーネント
- [x] ChatInterfaceコンポーネント (`src/components/chat/ChatInterface.tsx`)
  - 状態管理（メッセージ、セッションID）
  - メッセージ送信ロジック
- [x] MessageListコンポーネント (`src/components/chat/MessageList.tsx`)
  - メッセージ一覧表示
  - マークダウンレンダリング
  - 自動スクロール
- [x] MessageInputコンポーネント (`src/components/chat/MessageInput.tsx`)
  - テキスト入力フィールド
  - 送信ボタン
  - 入力バリデーション（最大文字数）
  - Enterキー送信対応

### 4.3 会話履歴コンポーネント
- [x] ConversationHistoryコンポーネント (`src/components/chat/ConversationHistory.tsx`)
  - 会話一覧表示
  - 会話選択機能
  - 新規会話開始ボタン
  - 会話削除機能

### 4.4 メインページ
- [x] メインページ実装 (`src/app/page.tsx`)
  - ChatInterfaceの統合
  - ConversationHistoryの統合
  - レスポンシブレイアウト

### 4.5 スタイリング
- [x] Tailwind CSSによるスタイリング
- [x] レスポンシブデザイン対応
- [x] ダークモード対応（オプション）

---

## Phase 5: テスト実装

### 5.1 ユニットテスト
- [x] ユーティリティ関数のテスト
  - MongoDB接続関数
  - Claude APIクライアント（モック使用）
- [x] コンポーネントのテスト
  - MessageInput
  - MessageList
  - ChatInterface（ロジック部分）
- [x] カバレッジ80%以上を確保

### 5.2 統合テスト
- [x] API Routesの統合テスト
  - `/api/chat` エンドポイント
  - `/api/conversations` エンドポイント
- [x] データベース操作のテスト
  - CRUD操作
  - エラーケース

### 5.3 E2Eテスト
- [x] Playwrightセットアップ
- [x] 主要フローのテスト
  - 新規会話開始
  - メッセージ送受信
  - 会話履歴の閲覧
  - 会話削除

---

## Phase 6: セキュリティ・パフォーマンス最適化

### 6.1 セキュリティ
- [x] 入力バリデーション強化
  - 最大文字数制限
  - XSS対策
- [x] レート制限の実装
  - API呼び出し制限（1分あたり10回など）
  - IPベースの制限
- [x] 環境変数の保護
  - API Keyのサーバーサイド専用化
  - CORS設定

### 6.2 パフォーマンス最適化
- [x] Claude APIストリーミングレスポンス実装
- [x] クライアントサイドキャッシング
- [x] 画像最適化（Next.js Image使用）
- [x] コード分割・遅延ロード

---

## Phase 7: Docker & デプロイ準備

### 7.1 Docker設定
- [x] Dockerfileの作成
  - マルチステージビルド
  - 本番環境最適化
- [x] docker-compose.ymlの作成
  - Next.jsアプリ
  - MongoDB（ローカル開発用）
- [x] .dockerignoreの作成

### 7.2 CI/CD設定
- [x] GitHub Actionsワークフロー作成
  - テスト自動実行
  - ビルド確認
  - デプロイ自動化（オプション）

### 7.3 Google Cloud Run デプロイ
- [x] GCPプロジェクト設定
- [x] Container Registryへのプッシュ設定
- [x] Cloud Run設定
  - 環境変数設定
  - リージョン設定
  - 自動スケーリング設定
- [x] デプロイテスト

---

## Phase 8: 最終確認・ドキュメント

### 8.1 最終テスト
- [x] 全テストスイートの実行
- [x] 本番環境での動作確認
- [x] パフォーマンステスト
- [x] セキュリティチェック

### 8.2 ドキュメント整備
- [x] README.mdの作成
  - セットアップ手順
  - 使用方法
  - トラブルシューティング
- [x] API仕様書の作成（必要に応じて）
- [x] デプロイ手順書の作成

### 8.3 リリース準備
- [x] プライバシーポリシー作成（必要に応じて）
- [x] 利用規約作成（必要に応じて）
- [x] ライセンス設定

---

## 優先順位と推奨実装順序

### Week 1: 基盤構築
1. Phase 1: プロジェクトセットアップ
2. Phase 2: バックエンド基盤

### Week 2: コア機能実装
3. Phase 3: API Routes実装
4. Phase 4.1-4.2: 基本UIとチャット機能

### Week 3: フロントエンド完成
5. Phase 4.3-4.5: 会話履歴とスタイリング
6. Phase 5.1-5.2: ユニット・統合テスト

### Week 4: 品質向上とデプロイ
7. Phase 5.3: E2Eテスト
8. Phase 6: セキュリティ・最適化
9. Phase 7: Docker・デプロイ
10. Phase 8: 最終確認

---

## 注意事項

### テストコード品質（厳守）
- **絶対に**意味のないアサーション（`expect(true).toBe(true)`）を書かない
- テストを通すためだけのハードコーディングは禁止
- 境界値、異常系、エラーケースを必ずテスト
- TDDアプローチを推奨（Red-Green-Refactor）

### コスト管理
- Claude APIは従量課金：開発中も使用量に注意
- MongoDB Atlasの無料枠を活用
- Cloud Runの無料枠を考慮

### 開発のコツ
- 小さく始めて段階的に機能追加
- 各フェーズ完了後に動作確認
- コミットは小さく、頻繁に
- 問題が発生したら早めに対処

---

**作成日**: 2026-01-04
**対象プロジェクト**: AI Chat (Claude API + Next.js + MongoDB)
