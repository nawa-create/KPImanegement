import { createClient } from '@/lib/supabase/server'
import { Card, Progress } from '@/components/ui'
import { TrendingUp, Target, Flame, Calendar } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 過去7日間のログを取得
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: logs } = await supabase
    .from('action_logs')
    .select(`
      *,
      actions!inner(
        kpis!inner(
          goals!inner(user_id)
        )
      )
    `)
    .eq('actions.kpis.goals.user_id', user?.id)
    .gte('logged_date', weekAgo.toISOString().split('T')[0])

  // 統計計算
  const totalLogs = logs?.length || 0
  const completedLogs = logs?.filter((l: any) => l.completed).length || 0
  const weeklyRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0

  // 連続日数計算（簡易版）
  let streak = 0
  const checkDate = new Date(today)
  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const dayLogs = logs?.filter((l: any) => l.logged_date === dateStr) || []
    const dayCompleted = dayLogs.some((l: any) => l.completed)

    if (dayCompleted) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i > 0) {
      break
    } else {
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  // 目標数
  const { data: goals } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user?.id)
    .eq('status', 'active')

  const activeGoals = goals?.length || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">分析</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">今週の達成率</span>
          </div>
          <p className="text-3xl font-bold">{weeklyRate}%</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-sm">連続日数</span>
          </div>
          <p className="text-3xl font-bold">{streak}日</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Target className="w-4 h-4" />
            <span className="text-sm">目標数</span>
          </div>
          <p className="text-3xl font-bold">{activeGoals}</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">今週の記録</span>
          </div>
          <p className="text-3xl font-bold">{completedLogs}</p>
        </Card>
      </div>

      {/* 週間カレンダー */}
      <Card className="space-y-4">
        <h2 className="font-semibold">今週の記録</h2>
        <div className="space-y-3">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekAgo)
            date.setDate(date.getDate() + i + 1)
            const dateStr = date.toISOString().split('T')[0]
            const dayLogs = logs?.filter((l: any) => l.logged_date === dateStr) || []
            const completed = dayLogs.filter((l: any) => l.completed).length
            const total = dayLogs.length || 1
            const rate = Math.round((completed / total) * 100)

            return (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 text-sm text-text-tertiary">
                  {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                </span>
                <div className="flex-1">
                  <Progress value={rate} size="sm" />
                </div>
                <span className="w-12 text-right text-sm text-text-secondary">
                  {rate}%
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 励ましメッセージ */}
      <Card className="text-center py-6 bg-gradient-to-br from-bg-tertiary to-bg-elevated">
        <p className="text-lg">
          {weeklyRate >= 80
            ? '素晴らしい週でした！この調子で続けましょう'
            : weeklyRate >= 50
            ? '良い調子です。来週はもう少し頑張れるかも'
            : streak > 0
            ? `${streak}日連続で記録中。継続が力になります`
            : '新しい週の始まり。一歩ずつ進みましょう'}
        </p>
      </Card>
    </div>
  )
}
