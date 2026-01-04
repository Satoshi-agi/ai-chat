# AI Chat - Claude Chatbot

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

シンプルで使いやすい、Anthropic Claude APIを活用したWebチャットボットアプリケーション

[機能](#機能) • [デモ](#デモ) • [セットアップ](#セットアップ) • [使用方法](#使用方法) • [デプロイ](#デプロイ) • [開発](#開発)

</div>

---

## 📋 目次

- [機能](#機能)
- [技術スタック](#技術スタック)
- [前提条件](#前提条件)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [API仕様](#api仕様)
- [デプロイ](#デプロイ)
- [開発](#開発)
- [テスト](#テスト)
- [トラブルシューティング](#トラブルシューティング)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

---

## ✨ 機能

- 🤖 **Claude AI統合** - Anthropic Claude 3.5 Sonnetによる高品質な対話
- 💬 **リアルタイムチャット** - ストリーミングレスポンス対応
- 📱 **レスポンシブデザイン** - モバイル、タブレット、デスクトップ対応
- 💾 **会話履歴** - MongoDB で会話を永続化
- 🎨 **モダンUI** - Tailwind CSS によるクリーンなインターフェース
- 🔒 **セキュリティ** - XSS対策、レート制限、入力バリデーション
- ⚡ **パフォーマンス** - コード分割、遅延ロード、SWRキャッシング
- 🐳 **Docker対応** - コンテナ化された環境
- 🚀 **Cloud Run対応** - Google Cloud Runへの簡単デプロイ

---

## 🛠 技術スタック

### フロントエンド
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: SWR
- **UI Components**: カスタムコンポーネント

### バックエンド
- **API**: Next.js API Routes
- **AI/LLM**: Anthropic Claude API
- **Database**: MongoDB
- **ODM**: Mongoose

### インフラ・ツール
- **Container**: Docker
- **Deployment**: Google Cloud Run
- **CI/CD**: GitHub Actions
- **Testing**: Jest, React Testing Library, Playwright

---

## 📦 前提条件

- **Node.js**: 20.x 以上
- **npm**: 10.x 以上
- **MongoDB**: 7.0 以上（MongoDB Atlas推奨）
- **Anthropic API Key**: [Anthropic Console](https://console.anthropic.com)で取得

### オプション
- **Docker**: ローカルでDockerを使用する場合
- **Google Cloud SDK**: Cloud Runにデプロイする場合

---

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/ai-chat.git
cd ai-chat
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

`.env.local` を編集して、必要な環境変数を設定:

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-chat

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: CORS設定
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: レート制限
API_RATE_LIMIT_PER_MINUTE=10
```

### 4. MongoDBのセットアップ

#### MongoDB Atlasを使用する場合（推奨）

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)でアカウント作成
2. 無料クラスターを作成
3. ネットワークアクセスで自分のIPアドレスを許可
4. データベースユーザーを作成
5. 接続文字列を取得して `MONGODB_URI` に設定

#### ローカルMongoDBを使用する場合

```bash
# Docker Composeでローカル MongoDB を起動
docker-compose -f docker-compose.dev.yml up -d
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

---

## 💻 使用方法

### 基本的な使い方

1. **新しい会話を開始**
   - メッセージ入力欄にテキストを入力
   - 「送信」ボタンをクリック、または `Ctrl+Enter` で送信

2. **会話履歴の表示**
   - サイドバーに過去の会話が表示されます
   - 会話をクリックして過去の対話を確認

3. **新しい会話**
   - 「新しい会話」ボタンで新規セッションを開始

4. **会話の削除**
   - 会話履歴の削除ボタンで不要な会話を削除

### キーボードショートカット

- `Ctrl + Enter` / `Cmd + Enter`: メッセージ送信

---

## 📡 API仕様

詳細なAPI仕様は [API_SPEC.md](./docs/API_SPEC.md) を参照してください。

### エンドポイント概要

#### チャット
- `POST /api/chat` - メッセージ送信（非ストリーミング）
- `POST /api/chat/stream` - メッセージ送信（ストリーミング）

#### 会話履歴
- `GET /api/conversations` - 会話一覧取得
- `GET /api/conversations/[sessionId]` - 特定会話取得
- `DELETE /api/conversations/[sessionId]` - 会話削除

#### ヘルスチェック
- `GET /api/health` - サービスヘルスチェック

---

## 🚢 デプロイ

### Google Cloud Run へのデプロイ

詳細は [デプロイガイド](./deploy/DEPLOYMENT.md) を参照してください。

#### クイックデプロイ

```bash
# 1. シークレットの設定
./deploy/setup-secrets.sh

# 2. デプロイ実行
./deploy/deploy.sh
```

#### GitHub Actions による自動デプロイ

`main` ブランチへのプッシュで自動的にデプロイされます:

```bash
git push origin main
```

### Docker での実行

```bash
# イメージをビルド
docker build -t ai-chat .

# コンテナを起動
docker run -p 3000:3000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e ANTHROPIC_API_KEY=your_api_key \
  ai-chat
```

### Docker Compose での実行

```bash
# アプリケーションとMongoDBを起動
docker-compose up
```

---

## 🔧 開発

### プロジェクト構造

```
ai-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx           # メインページ
│   ├── components/            # Reactコンポーネント
│   │   ├── chat/              # チャット関連
│   │   ├── ui/                # UI部品
│   │   └── providers/         # プロバイダー
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ユーティリティ
│   ├── models/                # Mongooseモデル
│   └── types/                 # TypeScript型定義
├── tests/                     # テストファイル
├── deploy/                    # デプロイ関連
└── public/                    # 静的ファイル
```

### 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# リンター実行
npm run lint

# 型チェック
npx tsc --noEmit
```

### コーディング規約

- **TypeScript**: strict モードで型安全性を確保
- **命名規則**:
  - コンポーネント: PascalCase
  - 関数・変数: camelCase
  - 定数: UPPER_SNAKE_CASE
- **フォーマット**: Prettier使用
- **コミット**: Conventional Commits形式

---

## 🧪 テスト

### テストの実行

```bash
# すべてのテストを実行
npm test

# カバレッジ付きで実行
npm run test:coverage

# E2Eテストを実行
npm run test:e2e

# 監視モード
npm run test:watch
```

### テストの種類

- **ユニットテスト**: コンポーネント、ユーティリティ関数
- **統合テスト**: API Routes、データベース操作
- **E2Eテスト**: Playwright による全体フロー

### カバレッジ

現在のカバレッジ:
- テスト済みコンポーネント: 90%以上
- ユーティリティ関数: 100%

---

## 🐛 トラブルシューティング

### よくある問題

#### MongoDB接続エラー

**症状**: `MongoServerError: bad auth`

**解決策**:
- `MONGODB_URI` の接続文字列を確認
- ユーザー名とパスワードが正しいか確認
- MongoDB Atlasのネットワークアクセス設定を確認

#### API Keyエラー

**症状**: `Invalid API key`

**解決策**:
- `ANTHROPIC_API_KEY` が正しく設定されているか確認
- APIキーの有効期限を確認
- [Anthropic Console](https://console.anthropic.com)でAPIキーを再生成

#### ビルドエラー

**症状**: TypeScript型エラー

**解決策**:
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 型チェック
npx tsc --noEmit
```

#### ポートが使用中

**症状**: `Port 3000 is already in use`

**解決策**:
```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
PORT=3001 npm run dev
```

### デバッグモード

詳細なログを有効にする:

```bash
LOG_LEVEL=debug npm run dev
```

### サポート

問題が解決しない場合:
1. [Issues](https://github.com/yourusername/ai-chat/issues)で既存の問題を確認
2. 新しいIssueを作成（テンプレートに従って詳細を記載）

---

## 🤝 貢献

プルリクエストを歓迎します！

### 貢献の手順

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- コードはリンターを通すこと
- テストを追加すること
- ドキュメントを更新すること
- コミットメッセージは明確に

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

---

## 👏 謝辞

- [Anthropic](https://www.anthropic.com) - Claude API
- [Vercel](https://vercel.com) - Next.js
- [MongoDB](https://www.mongodb.com) - Database
- すべての貢献者とオープンソースコミュニティ

---

## 📞 サポート・お問い合わせ

- **ドキュメント**: [Wiki](https://github.com/yourusername/ai-chat/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-chat/discussions)

---

<div align="center">

Made with ❤️ by [Your Name](https://github.com/yourusername)

⭐️ このプロジェクトが気に入ったらスターをお願いします！

</div>
