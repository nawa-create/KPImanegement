'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Check, X } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { ProposedKPI } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface GoalAnalysis {
  refined_title: string
  motivation: string
  timeline: string
}

interface Proposal {
  ready: boolean
  goal_analysis?: GoalAnalysis
  proposed_kpis: ProposedKPI[]
  message?: string
}

export default function NewGoalPage() {
  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showProposal, setShowProposal] = useState(false)

  // 初期メッセージ
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'こんにちは！目標達成のサポートをさせてください。\n\nまず、達成したい目標を教えてください。どんな小さなことでも大丈夫です。',
      },
    ])
  }, [])

  // メッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const allMessages = [...messages, { role: 'user' as const, content: userMessage }]

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages.slice(1) }), // 初期メッセージを除く
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      // JSONブロックを除いたメッセージを表示
      const cleanMessage = data.message.replace(/```json[\s\S]*?```/g, '').trim()
      setMessages((prev) => [...prev, { role: 'assistant', content: cleanMessage }])

      if (data.proposal?.ready) {
        setProposal(data.proposal)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '申し訳ありません、エラーが発生しました。もう一度お試しください。' },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRemoveKPI = (kpiIndex: number) => {
    if (!proposal) return
    setProposal({
      ...proposal,
      proposed_kpis: proposal.proposed_kpis.filter((_, i) => i !== kpiIndex),
    })
  }

  const handleRemoveAction = (kpiIndex: number, actionIndex: number) => {
    if (!proposal) return
    setProposal({
      ...proposal,
      proposed_kpis: proposal.proposed_kpis.map((kpi, i) =>
        i === kpiIndex
          ? { ...kpi, actions: kpi.actions.filter((_, j) => j !== actionIndex) }
          : kpi
      ),
    })
  }

  const handleSave = async () => {
    if (!proposal) return

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 最初のユーザーメッセージを目標タイトルとして使用
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || '新しい目標'
      const goalTitle = proposal.goal_analysis?.refined_title || firstUserMessage

      // 目標を作成
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalTitle,
          target_date: null,
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
            metric_type: kpi.metric_type || 'number',
            target_value: kpi.target_value,
            unit: kpi.unit,
          })
          .select()
          .single()

        if (kpiError) throw kpiError

        const actionsToInsert = kpi.actions.map((action) => ({
          kpi_id: kpiData.id,
          title: action.title,
          action_type: action.action_type || 'daily',
          tracking_type: action.tracking_type || 'checkbox',
          target_value: action.target_value,
          unit: action.unit,
        }))

        const { error: actionsError } = await supabase
          .from('actions')
          .insert(actionsToInsert)

        if (actionsError) throw actionsError
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Save error:', error)
      alert('保存に失敗しました。もう一度お試しください。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col -mx-6 -my-8 px-6 py-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/5">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-semibold">目標を設定</h1>
      </div>

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-primary'
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ローディング */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-bg-tertiary rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-text-tertiary"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 提案表示ボタン */}
      {proposal && !showProposal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Button onClick={() => setShowProposal(true)} fullWidth>
            提案を確認する
          </Button>
        </motion.div>
      )}

      {/* 提案モーダル */}
      <AnimatePresence>
        {showProposal && proposal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end"
            onClick={() => setShowProposal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-h-[85vh] bg-bg-primary rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 overflow-y-auto max-h-[85vh]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">提案されたKPIと行動</h2>
                  <button
                    onClick={() => setShowProposal(false)}
                    className="p-2 rounded-full hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 目標サマリー */}
                {proposal.goal_analysis && (
                  <Card className="mb-4">
                    <h3 className="font-semibold text-accent mb-2">
                      {proposal.goal_analysis.refined_title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {proposal.goal_analysis.motivation}
                    </p>
                    {proposal.goal_analysis.timeline && (
                      <p className="text-xs text-text-tertiary mt-2">
                        期限: {proposal.goal_analysis.timeline}
                      </p>
                    )}
                  </Card>
                )}

                {/* KPI一覧 */}
                <div className="space-y-4 mb-6">
                  {proposal.proposed_kpis.map((kpi, kpiIndex) => (
                    <Card key={kpiIndex}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-xs text-accent font-medium">KPI {kpiIndex + 1}</span>
                          <h4 className="font-semibold">{kpi.title}</h4>
                          {kpi.target_value && (
                            <p className="text-sm text-text-secondary">
                              目標: {kpi.target_value} {kpi.unit}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveKPI(kpiIndex)}
                          className="p-1 rounded hover:bg-white/5 text-text-tertiary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {kpi.actions.map((action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-bg-elevated"
                          >
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-accent" />
                              <div>
                                <p className="text-sm">{action.title}</p>
                                <p className="text-xs text-text-tertiary">
                                  {action.action_type === 'daily' ? '毎日' : action.action_type === 'weekly' ? '毎週' : '一度'}
                                  {action.target_value && ` • ${action.target_value}${action.unit}`}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAction(kpiIndex, actionIndex)}
                              className="p-1 rounded hover:bg-white/5 text-text-tertiary"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* アクションボタン */}
                <div className="space-y-3 pb-6">
                  <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    fullWidth
                    size="lg"
                  >
                    この内容で始める
                  </Button>
                  <Button
                    onClick={() => setShowProposal(false)}
                    variant="ghost"
                    fullWidth
                  >
                    会話を続ける
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 入力エリア */}
      <div className="pt-4 pb-2 bg-bg-primary">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            disabled={isLoading}
            className="flex-1 bg-bg-tertiary text-text-primary rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-accent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-light transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
