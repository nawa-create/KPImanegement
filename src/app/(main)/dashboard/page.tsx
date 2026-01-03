import { createClient } from '@/lib/supabase/server'
import { getGreeting } from '@/lib/utils'
import { DashboardContent } from './content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 今日のアクションを取得
  const today = new Date().toISOString().split('T')[0]

  const { data: actions } = await supabase
    .from('actions')
    .select(`
      *,
      kpis!inner(
        title,
        goals!inner(
          title,
          user_id
        )
      ),
      action_logs(
        *
      )
    `)
    .eq('kpis.goals.user_id', user?.id)
    .eq('action_type', 'daily')
    .order('created_at')

  // 今日のログをフィルタ
  const todayActions = (actions || []).map((action: any) => ({
    ...action,
    goal_title: action.kpis.goals.title,
    kpi_title: action.kpis.title,
    today_log: action.action_logs?.find((log: any) => log.logged_date === today),
  }))

  // 週間の進捗を取得
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  const { data: weekLogs } = await supabase
    .from('action_logs')
    .select('logged_date, completed')
    .in('logged_date', weekDays)

  const weekData = weekDays.map((date, i) => {
    const dayLogs = (weekLogs || []).filter((log: any) => log.logged_date === date)
    const completed = dayLogs.filter((log: any) => log.completed).length
    const total = todayActions.length || 1
    const isFuture = new Date(date) > new Date()

    const status = isFuture
      ? 'future' as const
      : completed === total && total > 0
      ? 'complete' as const
      : completed > 0
      ? 'partial' as const
      : 'none' as const

    return {
      date,
      day: ['月', '火', '水', '木', '金', '土', '日'][i],
      completed,
      total,
      status,
    }
  })

  const greeting = getGreeting()

  return (
    <DashboardContent
      greeting={greeting}
      actions={todayActions}
      weekData={weekData}
      today={today}
    />
  )
}
