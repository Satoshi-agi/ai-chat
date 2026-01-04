# AI Chat - 本番環境デプロイメントガイド

最終更新: 2026-01-04

このドキュメントは、AI ChatアプリケーションをGoogle Cloud Runに本番デプロイするための完全なガイドです。

---

## 📋 前提条件

### 必須サービス

1. **Google Cloud Platform**
   - アクティブなGCPプロジェクト
   - 課金が有効化されていること
   - 必要なAPIが有効化されていること

2. **MongoDB Atlas**
   - Replica Set構成（推奨）
   - M10以上のクラスタ（本番環境）
   - 接続文字列の取得済み

3. **Anthropic Claude API**
   - APIキーの取得済み
   - 利用上限の確認

4. **GitHub**
   - リポジトリのアクセス権限
   - GitHub Actions の有効化

### 推奨サービス（本番環境）

5. **Redis**（重要）
   - レート制限の分散管理用
   - Google Cloud Memorystore または Upstash Redis推奨

6. **モニタリング・ロギング**
   - Sentry（エラートラッキング）
   - Google Cloud Logging（ログ集約）

---

## 🔧 環境変数

### 必須環境変数

以下の環境変数をGCP Secret Managerに登録してください：

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# MongoDB接続文字列
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-chat?retryWrites=true&w=majority

# Next.js設定
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### オプション環境変数

```bash
# レート制限設定
API_RATE_LIMIT_PER_MINUTE=10

# CORS設定
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Redis接続（本番環境で強く推奨）
REDIS_URL=redis://username:password@host:port

# Sentryエラートラッキング（推奨）
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/xxxxxxx
SENTRY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# ログレベル
LOG_LEVEL=info
```

---

## 🚀 デプロイ手順

### ステップ1: GCPプロジェクトのセットアップ

#### 1.1 必要なAPIの有効化

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable compute.googleapis.com
```

または、GCPコンソールで手動で有効化：
- https://console.cloud.google.com/apis/library

#### 1.2 サービスアカウントの作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create github-actions \
  --description="GitHub Actions deployment" \
  --display-name="GitHub Actions"

# ロール付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# JSONキーの作成
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

---

### ステップ2: Secret Managerの設定

#### 2.1 シークレットの作成（GCPコンソール）

1. **Secret Managerに移動**
   https://console.cloud.google.com/security/secret-manager

2. **ANTHROPIC_API_KEYの作成**
   - 「シークレットを作成」をクリック
   - 名前: `ANTHROPIC_API_KEY`
   - シークレットの値: あなたのAnthropicAPIキー
   - 「シークレットを作成」

3. **MONGODB_URIの作成**
   - 「シークレットを作成」をクリック
   - 名前: `MONGODB_URI`
   - シークレットの値: あなたのMongoDB接続文字列
   - 「シークレットを作成」

4. **REDIS_URLの作成**（推奨）
   - 「シークレットを作成」をクリック
   - 名前: `REDIS_URL`
   - シークレットの値: あなたのRedis接続文字列

#### 2.2 シークレットの作成（gcloud CLI）

```bash
# ANTHROPIC_API_KEY
echo -n "sk-ant-your-api-key" | \
  gcloud secrets create ANTHROPIC_API_KEY \
  --data-file=-

# MONGODB_URI
echo -n "mongodb+srv://..." | \
  gcloud secrets create MONGODB_URI \
  --data-file=-

# REDIS_URL (オプションだが推奨)
echo -n "redis://..." | \
  gcloud secrets create REDIS_URL \
  --data-file=-
```

---

### ステップ3: GitHub Secretsの設定

GitHubリポジトリの設定で以下のSecretsを追加：

1. **Settings → Secrets and variables → Actions → New repository secret**

2. **GCP_PROJECT_ID**
   - Value: あなたのGCPプロジェクトID（例: `ai-chat-123456`）

3. **GCP_SA_KEY**
   - Value: `key.json`ファイルの全内容をコピー＆ペースト

---

### ステップ4: デプロイの実行

#### 4.1 コードのプッシュ

```bash
# 変更をコミット
git add .
git commit -m "Ready for production deployment"

# mainブランチにプッシュ（自動デプロイが開始されます）
git push origin main
```

#### 4.2 デプロイの監視

GitHub Actionsの進捗を確認：
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

#### 4.3 手動デプロイ（必要な場合）

GitHub Actionsで手動実行：
1. Actions タブに移動
2. 「Deploy to Google Cloud Run」ワークフローを選択
3. 「Run workflow」をクリック
4. ブランチを選択して「Run workflow」

---

## ⚙️ Cloud Run設定

### 推奨設定

```yaml
リソース:
  CPU: 1
  メモリ: 512Mi
  最大同時リクエスト数: 80

スケーリング:
  最小インスタンス数: 1  # コールドスタート回避
  最大インスタンス数: 10 # コストとパフォーマンスのバランス

タイムアウト:
  リクエストタイムアウト: 300秒 (5分)

認証:
  未認証の呼び出しを許可: はい
```

### リージョンの選択

日本向けサービスの場合: `asia-northeast1` (東京)

---

## 🔐 セキュリティ設定

### 1. CORS設定

`src/middleware.ts` で許可するオリジンを設定：

```typescript
const allowedOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com',
];
```

### 2. レート制限

本番環境では、Redisを使用したレート制限に切り替えてください：

**現在の制限（インメモリ）:**
- 単一インスタンスのみ有効
- 複数インスタンスでは機能しない

**推奨:**
- Google Cloud Memorystore (Redis)
- Upstash Redis（サーバーレスRedis）

**実装例（`src/lib/rateLimit.ts`）:**
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// 既存のrateLimitStoreの代わりにRedisを使用
```

### 3. シークレットのローテーション

定期的にAPIキーとシークレットをローテーション：
- Anthropic APIキー: 3-6ヶ月ごと
- MongoDBパスワード: 3-6ヶ月ごと
- GCPサービスアカウントキー: 年1回

---

## 📊 モニタリング

### Google Cloud Monitoring

1. **ダッシュボード作成**
   - Cloud Run メトリクス
   - リクエスト数、レイテンシ、エラー率

2. **アラート設定**
   - エラー率 > 5%
   - レスポンスタイム > 3秒
   - メモリ使用率 > 80%

### Sentryの統合（推奨）

```bash
# インストール
npm install @sentry/nextjs

# 初期化
npx @sentry/wizard@latest -i nextjs
```

### ログ管理

Google Cloud Loggingで以下をモニタリング：
- エラーログ
- APIリクエストログ
- パフォーマンスログ

---

## 🗄️ データベース設定

### MongoDB Atlas設定

#### Replica Set構成（本番環境必須）

1. **クラスタ選択**
   - M10以上（本番環境推奨）
   - 3ノードReplica Set
   - 自動バックアップ有効化

2. **ネットワークアクセス**
   - GCPのIPレンジを許可
   - または VPC Peering設定

3. **接続文字列**
```
mongodb+srv://username:password@cluster.mongodb.net/ai-chat?retryWrites=true&w=majority&readPreference=primaryPreferred
```

#### パフォーマンス最適化

```javascript
// src/lib/mongodb.ts の最適化オプション
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
};
```

#### インデックスの作成

```javascript
// Conversationモデルにインデックスを追加
conversationSchema.index({ sessionId: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ 'messages.timestamp': -1 });
```

---

## 📈 スケーリング戦略

### 水平スケーリング

Cloud Runの自動スケーリング設定：

```yaml
最小インスタンス数: 1
最大インスタンス数: 10
CPU使用率しきい値: 80%
同時リクエスト数しきい値: 80
```

### コスト最適化

1. **コールドスタート対策**
   - 最小インスタンス数を1に設定
   - ウォームアップリクエストの定期実行

2. **リソース最適化**
   - 初期: 512Mi メモリ
   - 負荷に応じて調整

3. **キャッシング戦略**
   - Redisでセッションキャッシュ
   - CDNで静的アセット配信

---

## 🔄 CI/CDパイプライン

### GitHub Actionsワークフロー

既存の`.github/workflows/deploy-cloud-run.yml`が以下を実行：

1. **ビルドステージ**
   - Dockerイメージのビルド
   - イメージのGCRへのプッシュ

2. **デプロイステージ**
   - Cloud Runへのデプロイ
   - 環境変数とシークレットの設定

3. **検証ステージ**
   - ヘルスチェック実行
   - デプロイ成功確認

### ロールバック手順

問題が発生した場合：

```bash
# 以前のリビジョンにロールバック
gcloud run services update-traffic ai-chat \
  --to-revisions=ai-chat-00001-abc=100 \
  --region=asia-northeast1
```

---

## 🧪 本番環境での検証

### デプロイ後のチェックリスト

- [ ] ヘルスチェックエンドポイントが正常に応答
- [ ] チャット機能が動作
- [ ] 会話履歴が保存・読み込み可能
- [ ] マークダウンレンダリングが正常
- [ ] レート制限が機能
- [ ] エラーが適切に処理されている
- [ ] MongoDBへの接続が安定
- [ ] Claude APIが正常に応答

### ヘルスチェック

```bash
# ヘルスチェック
curl https://your-app-url.run.app/api/health

# 期待されるレスポンス
{
  "status": "ok",
  "timestamp": "2026-01-04T12:00:00.000Z"
}
```

### ロードテスト（推奨）

```bash
# Apache Benchを使用
ab -n 1000 -c 10 https://your-app-url.run.app/api/health

# または Artillery
npm install -g artillery
artillery quick --count 100 --num 10 https://your-app-url.run.app/
```

---

## 🐛 トラブルシューティング

### よくある問題

#### 1. シークレットへのアクセスエラー

```
Error: Secret not found
```

**解決策:**
- Secret Managerでシークレットが作成されているか確認
- サービスアカウントに`secretmanager.secretAccessor`ロールがあるか確認

#### 2. MongoDB接続エラー

```
MongoNetworkError: connection timeout
```

**解決策:**
- MongoDB Atlasのネットワークアクセス設定を確認
- 接続文字列が正しいか確認
- VPC Peeringが設定されているか確認

#### 3. コールドスタート遅延

**解決策:**
- 最小インスタンス数を1以上に設定
- メモリを増やす（512Mi → 1Gi）

#### 4. レート制限が複数インスタンスで機能しない

**原因:** インメモリストアを使用している

**解決策:** Redisに移行

---

## 📝 バックアップ・復旧

### MongoDB バックアップ

1. **Atlas自動バックアップ**
   - M10以上のクラスタで自動有効化
   - ポイントインタイムリカバリ可能

2. **手動エクスポート**
```bash
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)
```

### 災害復旧計画

1. **RTO (Recovery Time Objective)**: 1時間以内
2. **RPO (Recovery Point Objective)**: 15分以内

**手順:**
1. 以前のCloud Runリビジョンにロールバック
2. MongoDBを最新のバックアップから復元
3. シークレットの再設定（必要な場合）

---

## 📞 サポート

### デプロイに関する問い合わせ

- GitHub Issues: `https://github.com/YOUR_USERNAME/ai-chat/issues`
- ドキュメント: このファイル（DEPLOYMENT.md）

### 外部サービスサポート

- **GCP**: https://cloud.google.com/support
- **MongoDB Atlas**: https://support.mongodb.com
- **Anthropic**: https://support.anthropic.com

---

## ✅ デプロイ完了後のタスク

- [ ] カスタムドメインの設定
- [ ] SSL証明書の確認
- [ ] DNSレコードの更新
- [ ] モニタリングアラートの設定
- [ ] ログ保持期間の設定
- [ ] バックアップスケジュールの確認
- [ ] チーム メンバーへのアクセス権限付与
- [ ] ドキュメントの更新

---

最終更新: 2026-01-04
次回レビュー予定: 2026-04-04
