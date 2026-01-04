# AI Chat - 実装残タスク

最終更新: 2026-01-04

このドキュメントは、CLAUDE.mdの仕様に対する現在の実装状況と、残っているタスクをまとめたものです。

---

## 📊 実装状況サマリー

### 完了している主要機能 ✅

- **基本チャット機能**: メッセージ送受信（非ストリーミング）
- **会話履歴リスト表示**: 過去の会話一覧の取得と表示
- **新規会話の開始**: セッションIDベースの会話管理
- **MongoDB統合**: データベース接続と永続化
- **API実装**: 全エンドポイント実装済み
- **入力バリデーション**: 包括的な検証とサニタイゼーション
- **レート制限**: IPベースの制限（本番環境ではRedis推奨）
- **セキュリティヘッダー**: CORS、CSP、その他のセキュリティ設定
- **Docker対応**: マルチステージビルドとdocker-compose
- **CI/CD**: GitHub Actionsによる自動テスト・デプロイ
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **ローディング表示**: ユーザーフィードバック

### 未完了・不完全な機能 ⚠️

- **マークダウンレンダリング**: Claudeの応答をマークダウン形式で表示
- **フロントエンドストリーミング**: バックエンドは実装済みだがフロントエンド未統合
- **会話履歴のロード機能**: リストの選択はできるが、過去の会話を読み込めない
- **ダークモードトグル**: CSSクラスは準備済みだが切り替えボタンがない
- **テストカバレッジ**: 目標80%に対して大幅に不足

---

## 🔴 HIGH優先度（本番リリース前に必須）

### 1. マークダウンレンダリングの実装

**理由**: ClaudeのレスポンスはMarkdown形式を多用するため、UXに直結

**タスク:**
```bash
# 依存関係のインストール
npm install react-markdown remark-gfm rehype-sanitize

# または
npm install marked
npm install --save-dev @types/marked
```

**変更ファイル:**
- `src/components/chat/MessageList.tsx`
  - `react-markdown`ライブラリを使用
  - コードブロックのシンタックスハイライト対応（`react-syntax-highlighter`）
  - リンクを安全に開く設定（`target="_blank" rel="noopener noreferrer"`）

**実装例:**
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

// MessageListコンポーネント内
{message.role === 'assistant' ? (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize]}
    className="prose dark:prose-invert max-w-none"
  >
    {message.content}
  </ReactMarkdown>
) : (
  <p className="whitespace-pre-wrap">{message.content}</p>
)}
```

**見積もり**: 2-3時間
**優先度**: 🔴 CRITICAL

---

### 2. 会話履歴のロード機能を完成させる

**理由**: コア機能として仕様書に明記されている

**現状の問題:**
- `src/app/page.tsx`の`handleSelectConversation`にコメントアウトされたコード
- 会話を選択しても、過去のメッセージが表示されない

**タスク:**

1. **APIクライアント関数の実装** (`src/lib/api.ts`を新規作成)
```typescript
export async function fetchConversation(sessionId: string) {
  const response = await fetch(`/api/conversations/${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch conversation');
  return response.json();
}
```

2. **page.tsxの修正**
```typescript
const handleSelectConversation = async (sessionId: string) => {
  try {
    setIsLoading(true);
    const data = await fetchConversation(sessionId);
    setCurrentSessionId(sessionId);
    setMessages(data.messages); // ChatInterfaceに渡す
  } catch (error) {
    console.error('Failed to load conversation:', error);
    // エラー表示
  } finally {
    setIsLoading(false);
  }
};
```

3. **ChatInterfaceコンポーネントの修正**
- `initialMessages` propを追加
- 初期メッセージがあれば状態にセット

**見積もり**: 2-3時間
**優先度**: 🔴 CRITICAL

---

### 3. コード重複の解消

**理由**: セキュリティリスク（異なる実装が混在）、保守性の低下

**問題:**
- `sanitizeInput()` が2箇所に存在
  - `src/lib/utils.ts`: 手動のエスケープ処理
  - `src/lib/validation.ts`: `sanitize-html`ライブラリ使用（より安全）

**タスク:**

1. **utils.tsから削除**
```typescript
// src/lib/utils.ts
// 以下の関数を削除:
// - sanitizeInput()
// - validateMessage()
```

2. **すべての参照をvalidation.tsに変更**
```bash
# 検索して確認
grep -r "from.*utils.*sanitizeInput" src/
grep -r "from.*utils.*validateMessage" src/

# validation.tsをインポート
import { sanitizeInput, validateMessage } from '@/lib/validation';
```

3. **テストの追加** (`tests/unit/validation.test.ts`を作成)
```typescript
describe('sanitizeInput', () => {
  it('should remove XSS attempts', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = sanitizeInput(malicious);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });
});
```

**見積もり**: 1-2時間
**優先度**: 🔴 HIGH（セキュリティ）

---

### 4. テストカバレッジの向上

**理由**: 仕様書で80%以上を目標に設定

**現状**: 大幅に不足（おそらく20-30%程度）

**タスク:**

#### ユニットテスト（優先順）

1. **validation.ts のテスト** (`tests/unit/validation.test.ts`)
   - `validateMessage()`: 正常系、異常系、境界値
   - `validateSessionId()`: UUID形式、不正な形式
   - `sanitizeInput()`: XSS、特殊文字
   - `validatePaginationParams()`: 範囲外、負の数

2. **rateLimit.ts のテスト** (`tests/unit/rateLimit.test.ts`)
   - レート制限の発動
   - ウィンドウのリセット
   - 異なるIPの分離

3. **claude.ts のテスト** (`tests/unit/claude.test.ts`)
   - モックを使用したAPI呼び出し
   - エラーハンドリング
   - リトライロジック

4. **utils.ts のテスト** (`tests/unit/utils.test.ts`)
   - `truncate()`, `formatDate()`, `simpleHash()`
   - 境界値テスト

5. **コンポーネントのテスト**
   - `Button.test.tsx`: ローディング状態、disabled状態
   - `Input.test.tsx`: バリデーション、エラー表示
   - `MessageInput.test.tsx`: 文字数カウント、送信処理

#### 統合テスト

6. **API統合テスト** (`tests/integration/`)
   - `/api/chat/stream`: ストリーミングレスポンス
   - `/api/health`: ヘルスチェック
   - レート制限の動作確認

#### E2Eテスト（Playwright）

7. **ユーザーフローテスト** (`tests/e2e/`)
   - メッセージ送受信の完全なフロー
   - 会話履歴の保存と読み込み
   - エラーハンドリングのUX

**見積もり**: 8-12時間
**優先度**: 🔴 HIGH

---

### 5. 本番環境の設定ドキュメント作成

**理由**: デプロイ時のトラブルを防ぐ

**タスク:**

1. **DEPLOYMENT.mdの作成**
```markdown
# 本番環境デプロイガイド

## 前提条件
- Redis（レート制限用）
- MongoDB Atlas（Replica Set構成推奨）
- Google Cloud Run

## 環境変数
- ANTHROPIC_API_KEY
- MONGODB_URI
- REDIS_URL (本番のみ)
- ALLOWED_ORIGINS
- API_RATE_LIMIT_PER_MINUTE

## レート制限の設定
本番環境では、Redisを使用したレート制限に切り替えてください。
詳細: src/lib/rateLimit.ts

## スケーリング
Cloud Runの最小・最大インスタンス数を設定してください。
推奨: min=1, max=10
```

2. **.env.exampleの更新**
```bash
# 本番環境用の変数を追加
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

**見積もり**: 1-2時間
**優先度**: 🔴 HIGH

---

## 🟡 MEDIUM優先度（リリース後早期に対応）

### 6. フロントエンドストリーミングの実装

**理由**: UX向上、リアルタイム感の向上

**現状:**
- バックエンドの `/api/chat/stream` は実装済み
- フロントエンドは非ストリーミングの `/api/chat` のみ使用

**タスク:**

1. **ChatInterfaceにストリーミングサポート追加**
```typescript
const handleStreamingSubmit = async (message: string) => {
  // EventSource または fetch with ReadableStream
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, conversationHistory }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  let assistantMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    assistantMessage += chunk;

    // リアルタイムでメッセージを更新
    setMessages(prev => [
      ...prev.slice(0, -1),
      { role: 'assistant', content: assistantMessage }
    ]);
  }
};
```

2. **ストリーミングインジケーターの追加**
- タイピングアニメーション
- "Claude is typing..." 表示

**見積もり**: 4-6時間
**優先度**: 🟡 MEDIUM

---

### 7. ダークモードトグルの実装

**理由**: オプション機能だが、UX向上

**現状:**
- Tailwind CSSの `dark:` クラスは準備済み
- トグルボタンとテーマ管理が未実装

**タスク:**

1. **ThemeProviderの作成** (`src/components/providers/ThemeProvider.tsx`)
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

2. **トグルボタンの追加** (`src/components/ui/ThemeToggle.tsx`)

3. **layout.tsxに統合**

**見積もり**: 2-3時間
**優先度**: 🟡 MEDIUM

---

### 8. エラーハンドリングの強化

**タスク:**

1. **MongoDB接続エラーの詳細化**
```typescript
// API routesで
try {
  const db = await connectDB();
  // ...
} catch (error) {
  if (error.name === 'MongoNetworkError') {
    return NextResponse.json(
      { error: 'Database connection failed. Please try again later.' },
      { status: 503 }
    );
  }
  // その他のエラー
}
```

2. **フロントエンドのタイムアウト設定**
```typescript
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 30000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};
```

3. **ストリーム中断時のロールバック**
- トランザクションサポート、または部分保存の防止

**見積もり**: 3-4時間
**優先度**: 🟡 MEDIUM

---

### 9. モニタリングとロギングの追加

**タスク:**

1. **Sentryの統合**（エラートラッキング）
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

2. **構造化ロギング**
```bash
npm install winston
```

3. **パフォーマンスモニタリング**
- Cloud RunのメトリクスをBigQueryにエクスポート
- カスタムメトリクスの追加

**見積もり**: 4-6時間
**優先度**: 🟡 MEDIUM

---

### 10. 会話履歴のバリデーション強化

**タスク:**

1. **conversationHistory配列の制限**
```typescript
// validation.ts
export function validateConversationHistory(history: any[]): boolean {
  if (!Array.isArray(history)) return false;
  if (history.length > 100) return false; // 最大100メッセージ

  return history.every(msg =>
    msg.role && ['user', 'assistant'].includes(msg.role) &&
    msg.content && typeof msg.content === 'string' &&
    msg.content.length <= 10000
  );
}
```

2. **会話あたりの最大メッセージ数**
```typescript
// Conversation.ts モデル
const conversationSchema = new Schema({
  // ...
  messages: {
    type: [messageSchema],
    validate: {
      validator: (v: any[]) => v.length <= 1000,
      message: 'Conversation cannot exceed 1000 messages'
    }
  }
});
```

**見積もり**: 2-3時間
**優先度**: 🟡 MEDIUM

---

## 🟢 LOW優先度（将来的な改善）

### 11. JSDocドキュメントの追加

**タスク:**
- 全エクスポート関数にJSDocコメントを追加
- コンポーネントのpropsと動作を文書化
- `typedoc`でAPIドキュメント生成

**見積もり**: 6-8時間
**優先度**: 🟢 LOW

---

### 12. 起動時の環境変数チェック

**タスク:**

1. **バリデーションスクリプトの作成** (`scripts/validate-env.ts`)
```typescript
const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'MONGODB_URI',
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

console.log('✅ All required environment variables are set');
```

2. **package.jsonに追加**
```json
{
  "scripts": {
    "validate-env": "ts-node scripts/validate-env.ts",
    "dev": "npm run validate-env && next dev",
    "build": "npm run validate-env && next build"
  }
}
```

**見積もり**: 1時間
**優先度**: 🟢 LOW

---

### 13. エラーメッセージの標準化

**タスク:**

1. **エラー定数ファイルの作成** (`src/lib/errors.ts`)
```typescript
export const ERROR_MESSAGES = {
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again in {seconds} seconds.',
  INVALID_MESSAGE: 'Message must be between 1 and 10,000 characters.',
  INVALID_SESSION_ID: 'Invalid session ID format.',
  DATABASE_ERROR: 'Database error. Please try again later.',
  API_ERROR: 'Failed to communicate with AI service.',
} as const;

export class AppError extends Error {
  constructor(
    public code: keyof typeof ERROR_MESSAGES,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(ERROR_MESSAGES[code]);
    this.name = 'AppError';
  }
}
```

2. **既存コードのリファクタリング**

**見積もり**: 2-3時間
**優先度**: 🟢 LOW

---

## 📈 将来の拡張機能（CLAUDE.mdより）

以下は、現在のスコープ外だが、将来的に実装を検討する機能です：

### 認証機能
- Firebase Auth または Auth0 の統合
- ユーザーアカウント管理
- プライベート会話の実装

### 会話共有機能
- 共有リンクの生成
- 公開/非公開設定
- 権限管理

### マルチモーダル対応
- 画像アップロード
- 画像を含む会話のサポート
- ファイルサイズとタイプのバリデーション

### カスタムプロンプト設定
- ユーザーごとのシステムプロンプト
- プリセットの保存
- テンプレート機能

### 複数AIモデル対応
- Claude、GPT-4などのモデル切り替え
- モデルごとの設定
- コスト管理

### 音声機能
- 音声入力（Speech-to-Text）
- 音声出力（Text-to-Speech）
- Web Speech API統合

### PWA化
- オフライン対応
- Service Worker
- インストール可能なアプリ

---

## 🔧 技術的負債・リファクタリング

### コードの問題点

1. **未使用の関数**
   - `src/lib/claude.ts`: `streamMessage()`, `validateAPIKey()`
   - `src/hooks/useConversations.ts`: `useDeleteConversation()`
   - これらを削除するか、実際に使用する

2. **マジックナンバー**
   - 文字数制限（10000）が複数箇所にハードコード
   - 中央集約された設定ファイル作成を推奨

3. **レート制限の本番対応**
   - 現在: インメモリストア（単一インスタンスのみ）
   - 必要: Redis統合（複数インスタンス対応）

---

## 📊 テストカバレッジ目標

| カテゴリ | 現状 | 目標 |
|---------|------|------|
| ユニットテスト | ~20% | 80%+ |
| 統合テスト | ~10% | 60%+ |
| E2Eテスト | ~5% | 主要フロー全カバー |

**優先的にテストを書くべきファイル:**
1. `src/lib/validation.ts` - セキュリティに直結
2. `src/lib/rateLimit.ts` - 重要なミドルウェア
3. `src/lib/claude.ts` - 外部API統合
4. `src/app/api/*` - 全APIエンドポイント

---

## 🎯 まとめ

### 本番リリース前の必須タスク（HIGH優先度）

1. ✅ マークダウンレンダリングの実装（2-3h）
2. ✅ 会話履歴のロード機能完成（2-3h）
3. ✅ コード重複の解消（1-2h）
4. ✅ テストカバレッジ向上（8-12h）
5. ✅ 本番環境ドキュメント作成（1-2h）

**合計見積もり**: 14-22時間

### 早期対応推奨（MEDIUM優先度）

6. フロントエンドストリーミング（4-6h）
7. ダークモードトグル（2-3h）
8. エラーハンドリング強化（3-4h）
9. モニタリング・ロギング（4-6h）
10. 会話履歴バリデーション（2-3h）

**合計見積もり**: 15-22時間

---

## 📝 注記

- 見積もり時間は開発者の経験レベルにより変動します
- テストの作成時間は実装時間の50-100%を見込んでください
- コードレビューとリファクタリングの時間は別途確保してください

**次のアクション**: HIGH優先度のタスクから順に着手することを推奨します。
