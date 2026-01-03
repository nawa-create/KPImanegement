'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Check, X, Plus, Edit2 } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { AIProposal, ProposedKPI, ProposedAction } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Step = 'input' | 'loading' | 'review' | 'saving'

export default function NewGoalPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('input')
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [proposal, setProposal] = useState<AIProposal | null>(null)
  const [editingKPI, setEditingKPI] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmitGoal = async () => {
    if (!title.trim()) return

    setStep('loading')
    setError(null)

    try {
      const response = await fetch('/api/ai/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, target_date: targetDate }),
      })

      if (!response.ok) throw new Error('Failed to get AI proposal')

      const data: AIProposal = await response.json()

      // IDを付与
      data.proposed_kpis = data.proposed_kpis.map((kpi, kIndex) => ({
        ...kpi,
        id: `kpi-${kIndex}`,
        actions: kpi.actions.map((action, aIndex) => ({
          ...action,
          id: `action-${kIndex}-${aIndex}`,
        })),
      }))

      setProposal(data)
      setStep('review')
    } catch (err) {
      console.error(err)
      setError('AIの提案を取得できませんでした。もう一度お試しください。')
      setStep('input')
    }
  }

  const handleRemoveKPI = (kpiId: string) => {
    if (!proposal) return
    setProposal({
      ...proposal,
      proposed_kpis: proposal.proposed_kpis.filter((k) => k.id !== kpiId),
    })
  }

  const handleRemoveAction = (kpiId: string, actionId: string) => {
    if (!proposal) return
    setProposal({
      ...proposal,
      proposed_kpis: proposal.proposed_kpis.map((kpi) =>
        kpi.id === kpiId
          ? { ...kpi, actions: kpi.actions.filter((a) => a.id !== actionId) }
          : kpi
      ),
    })
  }

  const handleSave = async () => {
    if (!proposal) return

    setStep('saving')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 目標を作成
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: proposal.goal_analysis?.refined_title || title,
          target_date: targetDate || null,
        })
        .select()
        .single()

      if (goalError) throw goalError

      // KPIと行動を作成
      for (const kpi of proposal.proposed_kpis) {
        const { data: kpiData, error: kpiError } = await supabase
          .from('kpis')
          .insert({
            goal_id: goal.id,
            title: kpi.title,
            metric_type: kpi.metric_type,
            target_value: kpi.target_value,
            unit: kpi.unit,
          })
          .select()
          .single()

        if (kpiError) throw kpiError

        // 行動を作成
        const actionsToInsert = kpi.actions.map((action) => ({
          kpi_id: kpiData.id,
          title: action.title,
          action_type: action.action_type,
          tracking_type: action.tracking_type,
          target_value: action.target_value,
          unit: action.unit,
        }))

        const { error: actionsError } = await supabase
          .from('actions')
          .insert(actionsToInsert)

        if (actionsError) throw actionsError
      }

      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setError('保存に失敗しました。もう一度お試しください。')
      setStep('review')
    }
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/5">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-semibold">新しい目標</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: 入力 */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">何を達成したい？</h2>
                <p className="text-text-secondary">
                  AIが具体的な行動に分解します
                </p>
              </div>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 英語を話せるようになりたい"
                className="text-xl"
              />

              <Input
                type="date"
                label="いつまでに？（任意）"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />

              {error && (
                <p className="text-error text-sm">{error}</p>
              )}
            </div>

            <Button
              onClick={handleSubmitGoal}
              disabled={!title.trim()}
              fullWidth
              size="lg"
              className="gap-2"
            >
              <Sparkles className="w-5 h-5" />
              AIに相談する
            </Button>
          </motion.div>
        )}

        {/* Step 2: ローディング */}
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="flex gap-2 mb-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-accent"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <p className="text-text-secondary">
              あなたの目標を
              <br />
              分析しています...
            </p>
          </motion.div>
        )}

        {/* Step 3: レビュー */}
        {(step === 'review' || step === 'saving') && proposal && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 目標分析 */}
            {proposal.goal_analysis && !proposal.goal_analysis.is_smart && (
              <Card className="border-l-4 border-warning">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-2">提案があります</p>
                    <ul className="text-sm text-text-secondary space-y-1">
                      {proposal.goal_analysis.suggestions.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* KPI一覧 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">提案されたKPIと行動</h2>

              {proposal.proposed_kpis.map((kpi) => (
                <KPICard
                  key={kpi.id}
                  kpi={kpi}
                  isEditing={editingKPI === kpi.id}
                  onEdit={() => setEditingKPI(editingKPI === kpi.id ? null : kpi.id!)}
                  onRemove={() => handleRemoveKPI(kpi.id!)}
                  onRemoveAction={(actionId) => handleRemoveAction(kpi.id!, actionId)}
                />
              ))}
            </div>

            {error && (
              <p className="text-error text-sm">{error}</p>
            )}

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleSave}
                isLoading={step === 'saving'}
                fullWidth
                size="lg"
              >
                この内容で始める
              </Button>
              <Button
                onClick={() => setStep('input')}
                variant="ghost"
                fullWidth
                disabled={step === 'saving'}
              >
                目標を修正する
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function KPICard({
  kpi,
  isEditing,
  onEdit,
  onRemove,
  onRemoveAction,
}: {
  kpi: ProposedKPI
  isEditing: boolean
  onEdit: () => void
  onRemove: () => void
  onRemoveAction: (actionId: string) => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs text-accent font-medium">KPI</span>
          <h3 className="font-semibold text-lg">{kpi.title}</h3>
          {kpi.target_value && (
            <p className="text-sm text-text-secondary">
              目標: {kpi.target_value} {kpi.unit}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
        {kpi.actions.map((action) => (
          <div
            key={action.id}
            className={cn(
              'flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-bg-elevated',
              isEditing && 'pr-2'
            )}
          >
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-accent" />
              <div>
                <p className="text-sm">{action.title}</p>
                <p className="text-xs text-text-tertiary">
                  {action.action_type === 'daily' ? '毎日' : action.action_type === 'weekly' ? '毎週' : '一度'}
                  {action.target_value && ` • ${action.target_value}${action.unit}`}
                </p>
              </div>
            </div>
            {isEditing && (
              <button
                onClick={() => onRemoveAction(action.id!)}
                className="p-1 rounded hover:bg-white/5 text-text-tertiary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
