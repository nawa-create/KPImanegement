export * from './cn'

// 日付フォーマット
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'short') {
    return d.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

// 今日かどうか
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

// 曜日の取得
export function getDayOfWeek(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}

// パーセンテージ計算
export function calculatePercentage(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

// 励ましメッセージ
export function getMotivationalMessage(completionRate: number): string {
  if (completionRate >= 100) return '素晴らしい！完璧な一日です'
  if (completionRate >= 80) return 'あと少しで、新しい自分に'
  if (completionRate >= 50) return '良い調子です、続けましょう'
  if (completionRate >= 20) return '一歩ずつ前進中'
  return '今日も始めましょう'
}

// 挨拶メッセージ
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'こんばんは'
  if (hour < 12) return 'おはようございます'
  if (hour < 18) return 'こんにちは'
  return 'こんばんは'
}
