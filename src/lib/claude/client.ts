import type { AIProposal, ProposedKPI } from '@/types'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
}

export async function callClaude(
  systemPrompt: string,
  messages: ClaudeMessage[]
): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Claude API Error Body:', errorBody)
    throw new Error(`Claude API error: ${response.status} - ${errorBody}`)
  }

  const data: ClaudeResponse = await response.json()
  return data.content[0].text
}

// 目標分解用のプロンプト
const DECOMPOSE_SYSTEM_PROMPT = `あなたはKPI管理の専門家です。ユーザーの目標を分析し、具体的なKPIと日々の行動に分解してください。

回答は必ず以下のJSON形式で返してください：

{
  "goal_analysis": {
    "is_smart": boolean,
    "suggestions": ["改善提案1", "改善提案2"],
    "refined_title": "より具体的な目標タイトル（必要な場合）"
  },
  "proposed_kpis": [
    {
      "title": "KPIタイトル",
      "metric_type": "number" | "percentage" | "boolean",
      "target_value": 数値,
      "unit": "単位",
      "actions": [
        {
          "title": "行動タイトル",
          "action_type": "daily" | "weekly" | "once",
          "tracking_type": "checkbox" | "number" | "time",
          "target_value": 数値,
          "unit": "単位"
        }
      ]
    }
  ]
}

ガイドライン：
1. SMARTフレームワーク（Specific, Measurable, Achievable, Relevant, Time-bound）で目標を評価
2. KPIは2〜3個、各KPIに対して行動は2〜4個が理想
3. 行動は具体的で、毎日または毎週実行可能なものにする
4. tracking_typeは行動の性質に応じて選択：
   - checkbox: やった/やってない
   - number: 回数や個数
   - time: 時間（分単位）
5. 日本語で回答してください`

export async function decomposeGoal(
  goalTitle: string,
  targetDate?: string,
  description?: string
): Promise<AIProposal> {
  const userMessage = `
目標: ${goalTitle}
${targetDate ? `期限: ${targetDate}` : ''}
${description ? `詳細: ${description}` : ''}

この目標を達成するための具体的なKPIと日々の行動に分解してください。
`

  const response = await callClaude(DECOMPOSE_SYSTEM_PROMPT, [
    { role: 'user', content: userMessage },
  ])

  // JSONを抽出してパース
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response')
  }

  return JSON.parse(jsonMatch[0]) as AIProposal
}

// 進捗分析用のプロンプト
const ANALYZE_SYSTEM_PROMPT = `あなたはモチベーションコーチです。ユーザーの進捗データを分析し、励ましと改善提案を提供してください。

回答は以下のJSON形式で返してください：

{
  "summary": "全体的な評価（1-2文）",
  "achievements": ["達成できたこと"],
  "improvements": ["改善できる点"],
  "suggestions": ["具体的な提案"],
  "motivational_message": "励ましのメッセージ"
}

ガイドライン：
1. ポジティブな点から始める
2. 批判ではなく、建設的な提案をする
3. 小さな進歩も認める
4. 日本語で、親しみやすい口調で回答`

export async function analyzeProgress(progressData: {
  goal_title: string
  completion_rate: number
  streak_days: number
  weekly_completion: number[]
}): Promise<{
  summary: string
  achievements: string[]
  improvements: string[]
  suggestions: string[]
  motivational_message: string
}> {
  const userMessage = `
目標: ${progressData.goal_title}
今週の達成率: ${progressData.completion_rate}%
連続日数: ${progressData.streak_days}日
日別達成率: ${progressData.weekly_completion.map((v, i) => `${['月', '火', '水', '木', '金', '土', '日'][i]}:${v}%`).join(', ')}

この進捗を分析してフィードバックをください。
`

  const response = await callClaude(ANALYZE_SYSTEM_PROMPT, [
    { role: 'user', content: userMessage },
  ])

  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response')
  }

  return JSON.parse(jsonMatch[0])
}
