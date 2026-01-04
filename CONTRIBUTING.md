# Contributing to AI Chat

AI Chatへの貢献に興味を持っていただき、ありがとうございます！このドキュメントでは、プロジェクトへの貢献方法について説明します。

## 目次

- [行動規範](#行動規範)
- [貢献の方法](#貢献の方法)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [プルリクエストのプロセス](#プルリクエストのプロセス)
- [コーディング規約](#コーディング規約)
- [コミットメッセージ規約](#コミットメッセージ規約)
- [バグ報告](#バグ報告)
- [機能リクエスト](#機能リクエスト)

---

## 行動規範

このプロジェクトは、[Contributor Covenant](https://www.contributor-covenant.org/)の行動規範を採用しています。プロジェクトに参加することで、この規範を遵守することに同意したものとみなされます。

---

## 貢献の方法

以下のような方法で貢献できます：

- 🐛 **バグ報告**: バグを見つけたらIssueを作成
- 💡 **機能提案**: 新機能のアイデアを提案
- 📝 **ドキュメント改善**: READMEやドキュメントの改善
- 🔧 **バグ修正**: バグを修正するPRを作成
- ✨ **新機能実装**: 新機能を実装するPRを作成
- 🧪 **テスト追加**: テストカバレッジの向上
- 🌍 **翻訳**: ドキュメントの翻訳

---

## 開発環境のセットアップ

### 1. リポジトリのフォーク

GitHubでリポジトリをフォークします。

### 2. クローン

```bash
git clone https://github.com/YOUR_USERNAME/ai-chat.git
cd ai-chat
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local`を編集して、必要な環境変数を設定します。

### 5. 開発サーバーの起動

```bash
npm run dev
```

### 6. テストの実行

```bash
npm test
```

---

## プルリクエストのプロセス

### 1. ブランチの作成

機能追加やバグ修正用のブランチを作成します：

```bash
git checkout -b feature/amazing-feature
# または
git checkout -b fix/bug-description
```

**ブランチ命名規則**:
- `feature/` - 新機能
- `fix/` - バグ修正
- `docs/` - ドキュメント
- `test/` - テスト追加
- `refactor/` - リファクタリング

### 2. 変更を実装

コーディング規約に従って変更を実装します。

### 3. テストの追加

新機能にはテストを追加してください：

```bash
# ユニットテストを実行
npm test

# カバレッジを確認
npm run test:coverage
```

### 4. リンターとフォーマッターの実行

```bash
# リンター
npm run lint

# 型チェック
npx tsc --noEmit
```

### 5. コミット

意味のあるコミットメッセージでコミットします：

```bash
git add .
git commit -m "feat: add user authentication"
```

### 6. プッシュ

フォークしたリポジトリにプッシュします：

```bash
git push origin feature/amazing-feature
```

### 7. プルリクエストの作成

GitHubでプルリクエストを作成します。

**PRテンプレート**:

```markdown
## 変更の概要
<!-- 何を変更したか簡潔に説明 -->

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] ドキュメント更新
- [ ] リファクタリング
- [ ] テスト追加

## 関連Issue
<!-- 関連するIssue番号（例: #123） -->

## テスト
<!-- どのようにテストしたか -->

## チェックリスト
- [ ] コードはリンターを通過している
- [ ] テストを追加/更新した
- [ ] ドキュメントを更新した
- [ ] コミットメッセージが規約に従っている
```

---

## コーディング規約

### TypeScript

- **厳格モード**: `strict: true`を使用
- **型定義**: `any`の使用を避ける
- **インターフェース**: 明確な型定義を作成

### 命名規則

```typescript
// コンポーネント: PascalCase
function ChatInterface() {}

// 関数・変数: camelCase
const getUserMessage = () => {};
const messageCount = 10;

// 定数: UPPER_SNAKE_CASE
const MAX_MESSAGE_LENGTH = 10000;

// プライベート: _プレフィックス
const _internalFunction = () => {};
```

### ファイル構成

- 1ファイル1コンポーネント/関数
- ロジックとUIの分離
- カスタムフックは`use`プレフィックス

### インポート順序

```typescript
// 1. 外部ライブラリ
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. 内部モジュール（絶対パス）
import Button from '@/components/ui/Button';
import { sendMessage } from '@/lib/claude';

// 3. 型定義
import type { Message } from '@/types';

// 4. 相対パス
import styles from './styles.module.css';
```

### コメント

```typescript
// 良い例: 「なぜ」を説明
// Workaround for Next.js hydration issue with dynamic imports
const DynamicComponent = dynamic(...)

// 悪い例: 「何を」説明（コードを見ればわかる）
// Increment counter by 1
counter += 1;
```

---

## コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従います。

### 形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマットなど）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `test`: テストの追加や修正
- `chore`: ビルドプロセスやツールの変更

### 例

```bash
feat(chat): add streaming response support

Implement Server-Sent Events for real-time message streaming.
This improves user experience with immediate feedback.

Closes #123

fix(api): handle rate limit errors correctly

Previously, rate limit errors were not properly caught,
causing unhandled exceptions.

refactor(components): extract message logic to custom hook

docs(readme): update setup instructions

test(chat): add unit tests for MessageInput component
```

---

## バグ報告

バグを見つけた場合は、以下の情報を含むIssueを作成してください：

### Issueテンプレート

```markdown
## バグの説明
<!-- 何が起きているか -->

## 再現手順
1. ○○する
2. △△をクリック
3. エラーが表示される

## 期待される動作
<!-- 本来どうあるべきか -->

## スクリーンショット
<!-- 可能であれば -->

## 環境
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
- npm: [e.g., 10.2.0]

## 追加情報
<!-- その他の関連情報 -->
```

---

## 機能リクエスト

新機能の提案は大歓迎です！以下の情報を含むIssueを作成してください：

### Issueテンプレート

```markdown
## 機能の概要
<!-- どんな機能か -->

## 動機・背景
<!-- なぜこの機能が必要か -->

## 提案する解決策
<!-- どのように実装するか -->

## 代替案
<!-- 他に考えられる方法 -->

## 追加情報
<!-- モックアップ、参考リンクなど -->
```

---

## 質問とサポート

- **GitHub Discussions**: 一般的な質問や議論
- **GitHub Issues**: バグ報告や機能リクエスト
- **Email**: 個別の質問は support@example.com

---

## ライセンス

貢献したコードは、プロジェクトのライセンス（MIT License）のもとで公開されます。

---

## 謝辞

貢献者の皆様に感謝します！

すべての貢献者は、[CONTRIBUTORS.md](./CONTRIBUTORS.md)に記載されます。

---

**ハッピーコーディング！** 🎉
