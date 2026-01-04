.PHONY: help setup dev build test lint clean docker-build docker-run docker-stop deploy-info

# デフォルトターゲット: ヘルプを表示
help:
	@echo "AI Chat - Available Commands"
	@echo "============================="
	@echo "setup          - 初期セットアップ（依存関係インストール + 環境変数設定）"
	@echo "dev            - 開発サーバーを起動"
	@echo "build          - 本番ビルドを実行"
	@echo "test           - テストを実行"
	@echo "test-watch     - テストを監視モードで実行"
	@echo "test-coverage  - カバレッジ付きでテストを実行"
	@echo "lint           - ESLintでコードチェック"
	@echo "clean          - ビルド成果物とnode_modulesを削除"
	@echo "docker-build   - Dockerイメージをビルド"
	@echo "docker-run     - Dockerコンテナをローカルで起動"
	@echo "docker-stop    - 実行中のDockerコンテナを停止"
	@echo "deploy-info    - デプロイ方法を表示"

# 初期セットアップ
setup:
	@echo "📦 依存関係をインストール中..."
	npm ci
	@echo ""
	@if [ ! -f .env.local ]; then \
		echo "⚙️  .env.localファイルを作成中..."; \
		cp .env.example .env.local; \
		echo "✅ .env.localを作成しました"; \
		echo "⚠️  .env.localファイルを編集して、環境変数を設定してください"; \
	else \
		echo "✅ .env.localは既に存在します"; \
	fi
	@echo ""
	@echo "✨ セットアップ完了！"
	@echo "次のステップ: .env.localファイルを編集して環境変数を設定してください"

# 開発サーバー起動
dev:
	@echo "🚀 開発サーバーを起動中..."
	npm run dev

# 本番ビルド
build:
	@echo "🔨 本番ビルドを実行中..."
	npm run build

# テスト実行
test:
	@echo "🧪 テストを実行中..."
	npm test

# テスト監視モード
test-watch:
	@echo "👀 テストを監視モードで実行中..."
	npm run test:watch

# カバレッジ付きテスト
test-coverage:
	@echo "📊 カバレッジ付きでテストを実行中..."
	npm run test:coverage

# ESLint実行
lint:
	@echo "🔍 ESLintでコードチェック中..."
	npm run lint || true

# クリーンアップ
clean:
	@echo "🧹 クリーンアップ中..."
	rm -rf .next
	rm -rf node_modules
	rm -rf coverage
	rm -rf dist
	@echo "✅ クリーンアップ完了"

# Dockerイメージビルド
docker-build:
	@echo "🐳 Dockerイメージをビルド中..."
	docker build -t ai-chat:latest .
	@echo "✅ Dockerイメージビルド完了"
	@docker images ai-chat:latest

# Dockerコンテナをローカルで起動
docker-run:
	@echo "🐳 Dockerコンテナを起動中..."
	@if [ ! -f .env.local ]; then \
		echo "❌ エラー: .env.localファイルが見つかりません"; \
		echo "   'make setup'を実行してください"; \
		exit 1; \
	fi
	docker run -d \
		--name ai-chat \
		-p 3000:3000 \
		--env-file .env.local \
		ai-chat:latest
	@echo "✅ コンテナが起動しました"
	@echo "📱 アクセス: http://localhost:3000"
	@echo "🛑 停止するには: make docker-stop"

# Dockerコンテナを停止
docker-stop:
	@echo "🛑 Dockerコンテナを停止中..."
	@docker stop ai-chat 2>/dev/null || true
	@docker rm ai-chat 2>/dev/null || true
	@echo "✅ コンテナを停止しました"

# デプロイ情報を表示
deploy-info:
	@echo "🚀 Google Cloud Run デプロイ方法"
	@echo "================================"
	@echo ""
	@echo "📋 必要な準備:"
	@echo "  1. GCPプロジェクトの作成"
	@echo "  2. 必要なAPIの有効化（Cloud Run, Container Registry, Secret Manager）"
	@echo "  3. サービスアカウントの作成とJSONキーのダウンロード"
	@echo "  4. GCP Secret Managerに環境変数を登録"
	@echo "     - ANTHROPIC_API_KEY"
	@echo "     - MONGODB_URI"
	@echo "  5. GitHub Secretsの設定"
	@echo "     - GCP_PROJECT_ID"
	@echo "     - GCP_SA_KEY"
	@echo ""
	@echo "🔄 デプロイ方法:"
	@echo "  1. 変更をコミット: git add . && git commit -m 'your message'"
	@echo "  2. mainブランチにプッシュ: git push origin main"
	@echo "  3. GitHub Actionsが自動的にデプロイを実行します"
	@echo ""
	@echo "📖 詳細はCLAUDE.mdを参照してください"

# Git関連のヘルパーコマンド
.PHONY: git-status git-commit git-push

git-status:
	@git status

git-commit:
	@echo "📝 変更をコミット中..."
	@git add .
	@git status
	@echo ""
	@read -p "コミットメッセージを入力: " msg; \
	git commit -m "$$msg"

git-push:
	@echo "⬆️  GitHubにプッシュ中..."
	@git push origin main
	@echo "✅ プッシュ完了"
	@echo "🔄 GitHub Actionsでデプロイが開始されます"
	@echo "📊 進捗: https://github.com/$$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
