import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `あなたはKPI管理の専門家であり、コーチです。ユーザーの目標を深く理解し、具体的で達成可能なKPIと行動に分解するサポートをします。

## あなたの役割

1. **質問フェーズ**: ユーザーの目標を明確にするために質問を行います
2. **提案フェーズ**: 十分な情報が集まったらKPIと行動を提案します

## 質問フェーズのガイドライン

以下の点を明確にするまで質問を続けてください：
- 目標の具体的な成功イメージは何か？
- なぜその目標を達成したいのか？（モチベーション）
- 現在の状況はどうか？（スタート地点）
- いつまでに達成したいか？（期限）
- どのくらいの時間を毎日/毎週割けるか？
- 過去に似た目標に挑戦したことはあるか？その結果は？

**重要**:
- 一度に多くの質問をしないでください（1-2個まで）
- 親しみやすく、励ましの姿勢で
- ユーザーの回答を踏まえて、次の質問を考える

## 回答フォーマット

質問フェーズでは通常のテキストで回答してください。

十分な情報が集まり、KPIを提案できる状態になったら、以下のJSON形式で回答してください：

\`\`\`json
{
  "ready": true,
  "goal_analysis": {
    "refined_title": "明確化された目標タイトル",
    "motivation": "ユーザーのモチベーション要約",
    "timeline": "期限"
  },
  "proposed_kpis": [
    {
      "title": "KPIタイトル",
      "metric_type": "number",
      "target_value": 数値,
      "unit": "単位",
      "rationale": "このKPIを設定した理由",
      "actions": [
        {
          "title": "行動タイトル",
          "action_type": "daily",
          "tracking_type": "checkbox",
          "target_value": 数値,
          "unit": "単位",
          "rationale": "この行動を設定した理由"
        }
      ]
    }
  ],
  "message": "ユーザーへの説明メッセージ"
}
\`\`\`

metric_type: "number" | "percentage" | "boolean"
action_type: "daily" | "weekly" | "once"
tracking_type: "checkbox" | "number" | "time"

## 注意事項

- JSONを返す前に、必ず「提案してもよいですか？」と確認してください
- ユーザーが「はい」「お願いします」などと答えたら、JSONで提案してください
- KPIは2〜3個、各KPIに対して行動は2〜4個が理想
- 行動は具体的で、毎日または毎週実行可能なものに
- 日本語で回答してください`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await request.json() as { messages: Message[] }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Claude API Error:', errorBody)
      return NextResponse.json({ error: 'AI API error' }, { status: 500 })
    }

    const data = await response.json()
    const assistantMessage = data.content[0].text

    // JSONが含まれているかチェック
    const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/)
    let proposal = null

    if (jsonMatch) {
      try {
        proposal = JSON.parse(jsonMatch[1])
      } catch (e) {
        // JSONパースエラーは無視（通常のテキスト回答として扱う）
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      proposal,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
