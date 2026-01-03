// =========================================
// データベース型定義
// =========================================

export type GoalStatus = 'active' | 'achieved' | 'archived'
export type MetricType = 'number' | 'percentage' | 'boolean'
export type ActionType = 'daily' | 'weekly' | 'once'
export type TrackingType = 'checkbox' | 'number' | 'time'
export type FeedbackType = 'decomposition' | 'analysis' | 'suggestion'
export type FeedbackStatus = 'pending' | 'accepted' | 'rejected' | 'modified'

// 目標
export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  status: GoalStatus
  target_date?: string
  created_at: string
  updated_at: string
}

// KPI（指標）
export interface KPI {
  id: string
  goal_id: string
  title: string
  metric_type: MetricType
  current_value?: number
  target_value?: number
  unit?: string
  created_at: string
  updated_at: string
}

// 行動
export interface Action {
  id: string
  kpi_id: string
  title: string
  action_type: ActionType
  tracking_type: TrackingType
  target_value?: number
  unit?: string
  created_at: string
  updated_at: string
}

// 行動ログ
export interface ActionLog {
  id: string
  action_id: string
  logged_date: string
  completed: boolean
  value?: number
  note?: string
  created_at: string
}

// AIフィードバック
export interface AIFeedback {
  id: string
  user_id: string
  target_type: 'goal' | 'kpi' | 'action' | 'progress'
  target_id: string
  feedback_type: FeedbackType
  content: AIProposal
  status: FeedbackStatus
  created_at: string
}

// =========================================
// AI提案の型
// =========================================

export interface AIProposal {
  goal_analysis?: GoalAnalysis
  proposed_kpis: ProposedKPI[]
}

export interface GoalAnalysis {
  is_smart: boolean
  suggestions: string[]
  refined_title?: string
}

export interface ProposedKPI {
  id?: string // 編集時に使用
  title: string
  metric_type: MetricType
  current_value?: number
  target_value?: number
  unit?: string
  actions: ProposedAction[]
}

export interface ProposedAction {
  id?: string // 編集時に使用
  title: string
  action_type: ActionType
  tracking_type: TrackingType
  target_value?: number
  unit?: string
}

// =========================================
// UI用の型
// =========================================

// 今日のアクション（ダッシュボード用）
export interface TodayAction extends Action {
  goal_title: string
  kpi_title: string
  today_log?: ActionLog
  streak?: number // 連続日数
}

// 進捗サマリー
export interface ProgressSummary {
  total_actions: number
  completed_actions: number
  completion_rate: number
  week_data: WeekDay[]
}

export interface WeekDay {
  date: string
  day: string
  completed: number
  total: number
  status: 'complete' | 'partial' | 'none' | 'future'
}

// 目標詳細（関連データ含む）
export interface GoalWithDetails extends Goal {
  kpis: KPIWithActions[]
  progress: number
}

export interface KPIWithActions extends KPI {
  actions: ActionWithLogs[]
  progress: number
}

export interface ActionWithLogs extends Action {
  logs: ActionLog[]
  streak: number
}
