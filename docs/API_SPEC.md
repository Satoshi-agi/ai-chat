# AI Chat - API仕様書

このドキュメントは、AI ChatアプリケーションのREST API仕様を定義します。

## 目次

- [概要](#概要)
- [認証](#認証)
- [レート制限](#レート制限)
- [エラーハンドリング](#エラーハンドリング)
- [エンドポイント](#エンドポイント)
  - [チャット](#チャット)
  - [会話履歴](#会話履歴)
  - [ヘルスチェック](#ヘルスチェック)

---

## 概要

### ベースURL

```
開発: http://localhost:3000
本番: https://your-domain.com
```

### リクエスト/レスポンス形式

- **Content-Type**: `application/json`
- **文字エンコーディング**: UTF-8

### バージョニング

現在のAPIバージョン: `v1`（URLに含まれない）

---

## 認証

現在、このAPIは公開エンドポイントとして設計されており、認証は不要です。

将来的にAPI Keyベースの認証を追加する場合:

```http
Authorization: Bearer YOUR_API_KEY
```

---

## レート制限

APIへのリクエストはレート制限されています。

### 制限値

| エンドポイント | 制限 |
|--------------|------|
| `/api/chat` | 10リクエスト/分 |
| `/api/chat/stream` | 10リクエスト/分 |
| `/api/conversations` | 30リクエスト/分 |
| その他 | 20リクエスト/分 |

### レート制限ヘッダー

すべてのレスポンスには、以下のヘッダーが含まれます:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1640995200000
```

### レート制限超過時

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30

{
  "error": "Rate limit exceeded. Please try again in 30 seconds."
}
```

---

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "error": "エラーメッセージ"
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| 200 | 成功 |
| 400 | 不正なリクエスト |
| 404 | リソースが見つからない |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

---

## エンドポイント

## チャット

### POST /api/chat

メッセージを送信し、AIの応答を取得します（非ストリーミング）。

#### リクエスト

```http
POST /api/chat
Content-Type: application/json
```

**Body:**

```json
{
  "message": "こんにちは、Claude!",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "conversationHistory": [
    {
      "role": "user",
      "content": "前のメッセージ",
      "timestamp": "2026-01-04T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "前の応答",
      "timestamp": "2026-01-04T10:00:05.000Z"
    }
  ]
}
```

**パラメータ:**

| フィールド | 型 | 必須 | 説明 |
|----------|---|------|------|
| message | string | Yes | ユーザーのメッセージ（1-10000文字） |
| sessionId | string | No | セッションID（UUID v4）。省略時は自動生成 |
| conversationHistory | array | No | 過去の会話履歴 |

#### レスポンス

**成功 (200 OK):**

```json
{
  "response": "こんにちは！何かお手伝いできることはありますか？",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**エラー (400 Bad Request):**

```json
{
  "error": "Message must be between 1 and 10000 characters"
}
```

**エラー (429 Too Many Requests):**

```json
{
  "error": "Rate limit exceeded. Please try again in 30 seconds."
}
```

#### サンプルコード

**JavaScript (fetch):**

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'こんにちは、Claude!',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
  }),
});

const data = await response.json();
console.log(data.response);
```

**cURL:**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは、Claude!",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

### POST /api/chat/stream

メッセージを送信し、AIの応答をストリーミングで取得します（Server-Sent Events）。

#### リクエスト

```http
POST /api/chat/stream
Content-Type: application/json
```

**Body:**

```json
{
  "message": "長い質問や複雑な内容...",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "conversationHistory": []
}
```

#### レスポンス

**成功 (200 OK):**

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**イベントストリーム:**

```
data: {"type":"session","sessionId":"550e8400-e29b-41d4-a716-446655440000"}

data: {"type":"text","content":"こんにちは"}

data: {"type":"text","content":"！"}

data: {"type":"text","content":"何か"}

data: {"type":"text","content":"お手伝い"}

data: {"type":"done"}
```

**イベントタイプ:**

| type | 説明 |
|------|------|
| session | セッションID通知 |
| text | テキストチャンク |
| done | ストリーム完了 |
| error | エラー発生 |

#### サンプルコード

**JavaScript (EventSource):**

```javascript
// Note: EventSource doesn't support POST, so use fetch with streaming
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'ストリーミングテスト',
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));

      if (data.type === 'text') {
        console.log(data.content);
      } else if (data.type === 'done') {
        console.log('Stream completed');
      }
    }
  }
}
```

---

## 会話履歴

### GET /api/conversations

会話履歴の一覧を取得します。

#### リクエスト

```http
GET /api/conversations?limit=10&offset=0
```

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|---|------|----------|------|
| limit | integer | No | 10 | 取得件数（1-100） |
| offset | integer | No | 0 | オフセット（ページネーション用） |

#### レスポンス

**成功 (200 OK):**

```json
{
  "conversations": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "こんにちは、Claude!",
      "createdAt": "2026-01-04T10:00:00.000Z",
      "messageCount": 5
    },
    {
      "sessionId": "660e8400-e29b-41d4-a716-446655440001",
      "title": "プログラミングについて",
      "createdAt": "2026-01-03T15:30:00.000Z",
      "messageCount": 12
    }
  ],
  "total": 25
}
```

**エラー (400 Bad Request):**

```json
{
  "error": "Limit must be between 1 and 100"
}
```

#### サンプルコード

**JavaScript:**

```javascript
const response = await fetch('/api/conversations?limit=10&offset=0');
const data = await response.json();

console.log(`Total conversations: ${data.total}`);
data.conversations.forEach(conv => {
  console.log(`${conv.title} - ${conv.messageCount} messages`);
});
```

**cURL:**

```bash
curl http://localhost:3000/api/conversations?limit=10&offset=0
```

---

### GET /api/conversations/[sessionId]

特定の会話の詳細を取得します。

#### リクエスト

```http
GET /api/conversations/550e8400-e29b-41d4-a716-446655440000
```

#### レスポンス

**成功 (200 OK):**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "こんにちは、Claude!",
      "timestamp": "2026-01-04T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "こんにちは！何かお手伝いできることはありますか？",
      "timestamp": "2026-01-04T10:00:05.000Z"
    }
  ],
  "createdAt": "2026-01-04T10:00:00.000Z",
  "updatedAt": "2026-01-04T10:00:05.000Z",
  "title": "こんにちは、Claude!"
}
```

**エラー (400 Bad Request):**

```json
{
  "error": "Session ID must be a valid UUID v4"
}
```

**エラー (404 Not Found):**

```json
{
  "error": "Conversation not found"
}
```

#### サンプルコード

**JavaScript:**

```javascript
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/api/conversations/${sessionId}`);
const data = await response.json();

console.log(`Title: ${data.title}`);
console.log(`Messages: ${data.messages.length}`);
```

---

### DELETE /api/conversations/[sessionId]

特定の会話を削除します。

#### リクエスト

```http
DELETE /api/conversations/550e8400-e29b-41d4-a716-446655440000
```

#### レスポンス

**成功 (200 OK):**

```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

**エラー (404 Not Found):**

```json
{
  "error": "Conversation not found"
}
```

#### サンプルコード

**JavaScript:**

```javascript
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/api/conversations/${sessionId}`, {
  method: 'DELETE',
});

const data = await response.json();
if (data.success) {
  console.log('Conversation deleted');
}
```

**cURL:**

```bash
curl -X DELETE http://localhost:3000/api/conversations/550e8400-e29b-41d4-a716-446655440000
```

---

## ヘルスチェック

### GET /api/health

サービスのヘルスチェックを実行します。

#### リクエスト

```http
GET /api/health
```

#### レスポンス

**成功 (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-04T10:00:00.000Z",
  "uptime": 123.456
}
```

**フィールド説明:**

| フィールド | 型 | 説明 |
|----------|---|------|
| status | string | サービスステータス（"healthy"） |
| timestamp | string | チェック実行時刻（ISO 8601） |
| uptime | number | サーバー稼働時間（秒） |

#### サンプルコード

**JavaScript:**

```javascript
const response = await fetch('/api/health');
const data = await response.json();

console.log(`Status: ${data.status}`);
console.log(`Uptime: ${data.uptime.toFixed(2)}s`);
```

**cURL:**

```bash
curl http://localhost:3000/api/health
```

---

## セキュリティ

### 入力バリデーション

すべての入力は以下のようにバリデーションされます:

- **メッセージ**: 1-10,000文字、HTMLタグは除去
- **セッションID**: UUID v4形式
- **ページネーション**: limit (1-100), offset (>=0)

### XSS対策

ユーザー入力はすべてサニタイズされ、HTMLタグは除去されます。

### CORS

CORS設定により、許可されたオリジンからのみアクセス可能です。

デフォルト許可オリジン:
- `http://localhost:3000`
- `NEXT_PUBLIC_APP_URL` の値

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|----------|------|---------|
| 1.0.0 | 2026-01-04 | 初版リリース |

---

## サポート

API に関する質問や問題がある場合:

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-chat/issues)
- **Email**: support@example.com

---

**最終更新**: 2026-01-04
