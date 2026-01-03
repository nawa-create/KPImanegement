# KPI管理ツール - 開発プラン

## 概要

目標達成を支援するKPI管理ツール。AIが目標を具体的な行動に分解し、進捗を可視化する。

## コンセプト

```
抽象的な目標 → AIが分析・提案 → ユーザーが確認・修正 → 登録 → 進捗管理 → AIがフィードバック
```

---

## 1. データ構造

### 3階層モデル

```
Goal（目標）
  └─ KPI（指標）
       └─ Action（行動）
```

### テーブル設計

```sql
-- ユーザー（Supabase Auth）
users
  - id: uuid
  - email: string
  - created_at: timestamp

-- 目標
goals
  - id: uuid
  - user_id: uuid (FK)
  - title: string           -- 「英語力を上げたい」
  - description: text       -- 詳細説明
  - status: enum            -- active / achieved / archived
  - target_date: date       -- 目標達成期限
  - created_at: timestamp
  - updated_at: timestamp

-- KPI（指標）
kpis
  - id: uuid
  - goal_id: uuid (FK)
  - title: string           -- 「TOEICスコア800点」
  - metric_type: enum       -- number / percentage / boolean
  - current_value: number   -- 現在値
  - target_value: number    -- 目標値
  - unit: string            -- 「点」「%」など
  - created_at: timestamp
  - updated_at: timestamp

-- 行動
actions
  - id: uuid
  - kpi_id: uuid (FK)
  - title: string           -- 「毎日30分リスニング練習」
  - action_type: enum       -- daily / weekly / once
  - tracking_type: enum     -- checkbox / number / time
  - target_value: number    -- 目標値（30分など）
  - unit: string            -- 「分」「回」など
  - created_at: timestamp
  - updated_at: timestamp

-- 行動ログ（進捗記録）
action_logs
  - id: uuid
  - action_id: uuid (FK)
  - logged_date: date
  - completed: boolean
  - value: number           -- 実績値
  - note: text              -- メモ
  - created_at: timestamp

-- AIフィードバック履歴
ai_feedbacks
  - id: uuid
  - user_id: uuid (FK)
  - target_type: enum       -- goal / kpi / action / progress
  - target_id: uuid
  - feedback_type: enum     -- decomposition / analysis / suggestion
  - content: jsonb          -- AIの提案内容
  - status: enum            -- pending / accepted / rejected / modified
  - created_at: timestamp
```

---

## 2. 機能一覧

### Phase 1: コア機能（MVP）

| 機能 | 説明 |
|------|------|
| 認証 | Supabase Auth（メール/Google） |
| 目標登録 | 目標を入力 |
| AI行動分解 | 目標 → KPI → 行動をAIが提案 |
| 提案の編集 | AIの提案を修正・追加・削除 |
| 進捗記録 | 日々の行動をチェック/数値入力 |
| ダッシュボード | 今日やるべき行動一覧 |

### Phase 2: 分析・フィードバック

| 機能 | 説明 |
|------|------|
| 進捗可視化 | カレンダー/グラフ表示 |
| AI進捗分析 | 週次レポート、改善提案 |
| 通知 | リマインダー（PWA通知） |

### Phase 3: 拡張機能

| 機能 | 説明 |
|------|------|
| 目標テンプレート | よくある目標のプリセット |
| 振り返り機能 | 週次/月次の振り返り支援 |
| エクスポート | データのCSV出力 |

---

## 3. 画面設計

### 画面一覧

```
1. ログイン/サインアップ
2. ダッシュボード（ホーム）
   - 今日のアクション一覧
   - 進捗サマリー
3. 目標一覧
4. 目標作成フロー
   4-1. 目標入力
   4-2. AI提案表示（編集可能）
   4-3. 確認・登録
5. 目標詳細
   - KPI一覧
   - 行動一覧
   - 進捗グラフ
6. 進捗記録（チェックイン）
7. 分析・レポート
8. 設定
```

### ワイヤーフレーム概要

```
┌─────────────────────────────┐
│  KPI Manager           [≡]  │  ← ヘッダー
├─────────────────────────────┤
│                             │
│  おはようございます！        │
│  今日のアクション            │
│                             │
│  ┌─────────────────────┐   │
│  │ □ 英単語50個暗記     │   │  ← チェックボックス
│  │   目標: 50個         │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ □ リスニング練習     │   │
│  │   [====    ] 15/30分 │   │  ← 数値入力
│  └─────────────────────┘   │
│                             │
│  ──────────────────────     │
│  進捗サマリー               │
│  今週: ████████░░ 80%       │
│                             │
├─────────────────────────────┤
│  [🏠] [📊] [➕] [📈] [⚙️]   │  ← ボトムナビ
└─────────────────────────────┘
```

---

## 4. AI活用詳細

### 4.1 目標分解（Claude API）

**入力例：**
```
目標: 英語力を上げたい
期限: 6ヶ月後
```

**AI出力例（JSON）：**
```json
{
  "goal_analysis": {
    "is_smart": false,
    "suggestions": ["具体的な数値目標を設定しましょう"]
  },
  "proposed_kpis": [
    {
      "title": "TOEICスコア",
      "current_value": null,
      "target_value": 800,
      "unit": "点",
      "actions": [
        {
          "title": "リスニング練習",
          "action_type": "daily",
          "tracking_type": "time",
          "target_value": 30,
          "unit": "分"
        },
        {
          "title": "英単語暗記",
          "action_type": "daily",
          "tracking_type": "number",
          "target_value": 50,
          "unit": "個"
        }
      ]
    }
  ]
}
```

### 4.2 進捗分析

週次で以下を分析：
- 達成率の計算
- トレンド（上昇/下降）
- ボトルネックの特定
- 改善提案

### 4.3 目標設定支援

SMARTフレームワークでチェック：
- **S**pecific（具体的か）
- **M**easurable（測定可能か）
- **A**chievable（達成可能か）
- **R**elevant（関連性があるか）
- **T**ime-bound（期限があるか）

---

## 5. 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| 状態管理 | Zustand or React Query |
| 認証 | Supabase Auth |
| データベース | Supabase (PostgreSQL) |
| AI | Claude API (Anthropic) |
| PWA | next-pwa |
| ホスティング | Vercel |

---

## 6. ディレクトリ構成

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証関連ページ
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (main)/             # メインアプリ
│   │   │   ├── dashboard/
│   │   │   ├── goals/
│   │   │   ├── check-in/
│   │   │   └── analytics/
│   │   ├── api/                # API Routes
│   │   │   ├── ai/
│   │   │   │   ├── decompose/  # 目標分解
│   │   │   │   ├── analyze/    # 進捗分析
│   │   │   │   └── suggest/    # 提案
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   ├── features/           # 機能別コンポーネント
│   │   │   ├── goals/
│   │   │   ├── kpis/
│   │   │   ├── actions/
│   │   │   └── ai/
│   │   └── layout/             # レイアウト
│   ├── lib/
│   │   ├── supabase/           # Supabaseクライアント
│   │   ├── claude/             # Claude APIクライアント
│   │   └── utils/
│   ├── hooks/                  # カスタムフック
│   ├── types/                  # 型定義
│   └── store/                  # 状態管理
├── public/
│   ├── manifest.json           # PWA設定
│   └── icons/
├── supabase/
│   └── migrations/             # DBマイグレーション
└── ...
```

---

## 7. 開発フェーズ

### Phase 1: 基盤構築（MVP）

1. プロジェクトセットアップ
   - Next.js + TypeScript初期化
   - Tailwind CSS + shadcn/ui設定
   - Supabase接続設定

2. 認証機能
   - ログイン/サインアップ
   - 認証状態管理

3. データベース
   - テーブル作成
   - RLS（Row Level Security）設定

4. 目標管理
   - 目標CRUD
   - KPI CRUD
   - 行動CRUD

5. AI連携
   - Claude API接続
   - 目標分解機能

6. 進捗記録
   - チェックイン機能
   - ログ保存

7. ダッシュボード
   - 今日のアクション表示

8. PWA対応
   - manifest.json
   - Service Worker

### Phase 2: 分析機能

9. 進捗可視化
   - カレンダービュー
   - グラフ表示

10. AI分析
    - 週次レポート
    - 改善提案

### Phase 3: UX向上

11. 通知機能
12. テンプレート
13. 振り返り機能

---

## 8. API設計

### 目標関連

```
POST   /api/goals              # 目標作成
GET    /api/goals              # 目標一覧
GET    /api/goals/:id          # 目標詳細
PUT    /api/goals/:id          # 目標更新
DELETE /api/goals/:id          # 目標削除
```

### AI関連

```
POST   /api/ai/decompose       # 目標分解
POST   /api/ai/analyze         # 進捗分析
POST   /api/ai/suggest         # 改善提案
POST   /api/ai/validate-goal   # SMART検証
```

### 進捗関連

```
POST   /api/check-in           # チェックイン
GET    /api/progress/:goalId   # 進捗取得
GET    /api/analytics          # 分析データ
```

---

## 9. セキュリティ

- Supabase RLSで行レベルセキュリティ
- API RouteでClaude APIキーを隠蔽
- 環境変数で機密情報管理
- HTTPS必須（Vercel標準）

---

## 10. 次のステップ

このプランに同意いただけましたら、以下の順で実装を進めます：

1. [ ] プロジェクト初期化（Next.js + TypeScript）
2. [ ] 基本設定（Tailwind, shadcn/ui）
3. [ ] Supabase設定・テーブル作成
4. [ ] 認証機能実装
5. [ ] 目標登録・AI分解機能
6. [ ] 進捗記録機能
7. [ ] ダッシュボード
8. [ ] PWA対応

---

## 決定事項

1. **認証方法**: Googleログイン
2. **言語**: 日本語UIのみ
3. **利用者**: 個人利用
4. **デザイン**: Appleライクな洗練されたダークUI（詳細は`DESIGN.md`参照）
5. **アプリ名**: ACHIEVE（仮）
