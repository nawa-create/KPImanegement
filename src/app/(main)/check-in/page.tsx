'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ActionWithLog {
  id: string
  title: string
  tracking_type: 'checkbox' | 'number' | 'time'
  target_value?: number
  unit?: string
  goal_title: string
  kpi_title: string
  log?: {
    id?: string
    completed: boolean
    value?: number
    note?: string
  }
}

export default function CheckInPage() {
  const router = useRouter()
  const supabase = createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [actions, setActions] = useState<ActionWithLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    loadActions()
  }, [])

  const loadActions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
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
        action_logs(*)
      `)
      .eq('kpis.goals.user_id', user.id)
      .eq('action_type', 'daily')

    const actionsWithLogs = (data || []).map((action: any) => {
      const todayLog = action.action_logs?.find(
        (log: any) => log.logged_date === todayStr
      )
      return {
        id: action.id,
        title: action.title,
        tracking_type: action.tracking_type,
        target_value: action.target_value,
        unit: action.unit,
        goal_title: action.kpis.goals.title,
        kpi_title: action.kpis.title,
        log: todayLog
          ? {
              id: todayLog.id,
              completed: todayLog.completed,
              value: todayLog.value,
              note: todayLog.note,
            }
          : {
              completed: false,
              value: 0,
            },
      }
    })

    setActions(actionsWithLogs)
    setIsLoading(false)
  }

  const updateAction = (actionId: string, updates: Partial<ActionWithLog['log']>) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === actionId
          ? { ...action, log: { ...action.log!, ...updates } }
          : action
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      for (const action of actions) {
        if (!action.log) continue

        if (action.log.id) {
          // 更新
          await supabase
            .from('action_logs')
            .update({
              completed: action.log.completed,
              value: action.log.value,
              note: note || null,
            })
            .eq('id', action.log.id)
        } else {
          // 新規作成
          await supabase.from('action_logs').insert({
            action_id: action.id,
            logged_date: todayStr,
            completed: action.log.completed,
            value: action.log.value,
            note: note || null,
          })
        }
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-accent"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/5">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <p className="text-sm text-text-secondary">{formatDate(today, 'long')}</p>
          <h1 className="text-xl font-semibold">今日の記録</h1>
        </div>
      </div>

      {/* アクション一覧 */}
      <div className="space-y-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
              <p className="text-sm text-text-tertiary mb-4">
                {action.goal_title} / {action.kpi_title}
              </p>

              {action.tracking_type === 'checkbox' ? (
                <button
                  onClick={() =>
                    updateAction(action.id, { completed: !action.log?.completed })
                  }
                  className={`w-full py-4 rounded-button flex items-center justify-center gap-2 transition-all ${
                    action.log?.completed
                      ? 'bg-accent text-white'
                      : 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated/80'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  {action.log?.completed ? '完了' : '完了にする'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() =>
                        updateAction(action.id, {
                          value: Math.max(0, (action.log?.value || 0) - (action.tracking_type === 'time' ? 5 : 1)),
                        })
                      }
                      className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center hover:bg-bg-elevated/80 transition-colors"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    <div className="text-center min-w-[100px]">
                      <span className="text-4xl font-bold">{action.log?.value || 0}</span>
                      <span className="text-xl text-text-secondary ml-1">{action.unit}</span>
                    </div>
                    <button
                      onClick={() =>
                        updateAction(action.id, {
                          value: (action.log?.value || 0) + (action.tracking_type === 'time' ? 5 : 1),
                          completed: true,
                        })
                      }
                      className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center hover:bg-bg-elevated/80 transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-center text-sm text-text-tertiary">
                    目標: {action.target_value} {action.unit}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* メモ */}
      <Card>
        <label className="block text-sm text-text-secondary mb-2">
          メモ（任意）
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="今日の振り返りを書いてみましょう"
          className="w-full bg-bg-elevated text-text-primary rounded-button p-4 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </Card>

      {/* 保存ボタン */}
      <Button onClick={handleSave} isLoading={isSaving} fullWidth size="lg">
        記録する
      </Button>
    </div>
  )
}
