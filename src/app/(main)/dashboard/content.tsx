'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Checkbox, Progress } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { TodayAction, WeekDay } from '@/types'
import { cn } from '@/lib/utils'

interface DashboardContentProps {
  greeting: string
  actions: TodayAction[]
  weekData: WeekDay[]
  today: string
}

export function DashboardContent({
  greeting,
  actions: initialActions,
  weekData,
  today,
}: DashboardContentProps) {
  const [actions, setActions] = useState(initialActions)
  const supabase = createClient()

  const completedCount = actions.filter((a) => a.today_log?.completed).length
  const totalCount = actions.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleToggleAction = async (action: TodayAction) => {
    const newCompleted = !action.today_log?.completed

    // Optimistic update
    setActions((prev) =>
      prev.map((a) =>
        a.id === action.id
          ? {
              ...a,
              today_log: {
                ...(a.today_log || { id: '', action_id: a.id, logged_date: today, created_at: '' }),
                completed: newCompleted,
                value: newCompleted ? action.target_value : 0,
              },
            }
          : a
      )
    )

    // Supabaseに保存
    if (action.today_log) {
      await supabase
        .from('action_logs')
        .update({ completed: newCompleted, value: newCompleted ? action.target_value : 0 })
        .eq('id', action.today_log.id)
    } else {
      await supabase.from('action_logs').insert({
        action_id: action.id,
        logged_date: today,
        completed: newCompleted,
        value: newCompleted ? action.target_value : 0,
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-text-secondary">{greeting}</p>
        <h1 className="text-3xl font-bold">
          今日、
          <br />
          何を達成する？
        </h1>
      </motion.div>

      {/* 今日のアクション */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {actions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-secondary mb-2">まだ目標がありません</p>
            <p className="text-sm text-text-tertiary">
              「+」ボタンから目標を追加しましょう
            </p>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                layout
              >
                <ActionCard
                  action={action}
                  onToggle={() => handleToggleAction(action)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.section>

      {/* 週間サマリー */}
      {actions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-text-secondary">今週の歩み</h2>
          <Card>
            <div className="flex justify-between items-center mb-4">
              {weekData.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-text-tertiary">{day.day}</span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                      day.status === 'complete' && 'bg-accent text-white',
                      day.status === 'partial' && 'bg-accent/30',
                      day.status === 'none' && 'bg-bg-elevated',
                      day.status === 'future' && 'bg-bg-elevated opacity-30',
                      day.date === today && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-tertiary'
                    )}
                  >
                    {day.status === 'complete' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {day.status === 'partial' && (
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Progress value={completionRate} showLabel size="md" />
          </Card>
        </motion.section>
      )}
    </div>
  )
}

function ActionCard({
  action,
  onToggle,
}: {
  action: TodayAction
  onToggle: () => void
}) {
  const isCompleted = action.today_log?.completed
  const currentValue = action.today_log?.value || 0
  const targetValue = action.target_value || 0

  return (
    <Card
      variant="interactive"
      className={cn(
        'transition-all duration-300',
        isCompleted && 'opacity-60'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-lg transition-all',
              isCompleted && 'line-through text-text-tertiary'
            )}
          >
            {action.title}
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            {action.goal_title} / {action.kpi_title}
          </p>
          {action.tracking_type !== 'checkbox' && (
            <div className="mt-3">
              <Progress
                value={currentValue}
                max={targetValue}
                size="sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                {currentValue} / {targetValue} {action.unit}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
