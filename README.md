# ACHIEVE

> 目標を、行動に。

AIが目標を具体的な行動に分解し、達成をサポートするKPI管理ツール。

## 機能

- **AI目標分解**: 抽象的な目標をClaude AIが具体的なKPIと行動に分解
- **進捗記録**: 日々の行動をチェック/数値で記録
- **習慣トラッカー**: カレンダーで継続状況を可視化
- **週次分析**: 達成率と改善提案をAIが分析
- **PWA対応**: iPhoneのホーム画面に追加してアプリとして利用可能

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Custom components + Radix UI
- **Animation**: Framer Motion
- **Auth & DB**: Supabase
- **AI**: Claude API (Anthropic)
- **Hosting**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成:

```bash
cp .env.example .env.local
```

以下の値を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CLAUDE_API_KEY=your_claude_api_key
```

### 3. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `supabase/migrations/001_initial_schema.sql`を実行
3. Authentication > ProvidersでGoogleを有効化

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 を開く

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ
│   ├── (main)/            # メインアプリ
│   │   ├── dashboard/     # ダッシュボード
│   │   ├── goals/         # 目標管理
│   │   ├── check-in/      # 進捗記録
│   │   └── analytics/     # 分析
│   └── api/               # API Routes
├── components/
│   ├── ui/                # 基本UIコンポーネント
│   └── layout/            # レイアウト
├── lib/
│   ├── supabase/          # Supabaseクライアント
│   ├── claude/            # Claude APIクライアント
│   └── utils/             # ユーティリティ
└── types/                 # 型定義
```

## デプロイ

### Vercel

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. デプロイ

## ライセンス

MIT
