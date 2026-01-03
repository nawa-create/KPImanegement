import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, Progress } from '@/components/ui'
import { ChevronRight, Plus } from 'lucide-react'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      kpis(
        *,
        actions(
          *,
          action_logs(*)
        )
      )
    `)
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // 進捗を計算
  const goalsWithProgress = (goals || []).map((goal: any) => {
    let totalActions = 0
    let completedLogs = 0

    goal.kpis?.forEach((kpi: any) => {
      kpi.actions?.forEach((action: any) => {
        totalActions++
        const logs = action.action_logs || []
        if (logs.some((log: any) => log.completed)) {
          completedLogs++
        }
      })
    })

    return {
      ...goal,
      progress: totalActions > 0 ? Math.round((completedLogs / totalActions) * 100) : 0,
      kpiCount: goal.kpis?.length || 0,
      actionCount: totalActions,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">目標</h1>
        <Link
          href="/goals/new"
          className="p-2 rounded-full bg-accent hover:bg-accent-light transition-colors"
        >
          <Plus className="w-5 h-5 text-white" />
        </Link>
      </div>

      {goalsWithProgress.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-2">まだ目標がありません</p>
          <p className="text-sm text-text-tertiary">
            「+」ボタンから目標を追加しましょう
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {goalsWithProgress.map((goal: any) => (
            <Link key={goal.id} href={`/goals/${goal.id}`}>
              <Card variant="interactive" className="group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{goal.title}</h3>
                    <p className="text-sm text-text-tertiary mt-1">
                      {goal.kpiCount} KPI • {goal.actionCount} アクション
                    </p>
                    <div className="mt-3">
                      <Progress value={goal.progress} size="sm" />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
