'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning'
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, size = 'md', variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.round((value / max) * 100), 100)

    const getVariantColor = () => {
      if (variant === 'success' || percentage >= 100) return 'bg-success'
      if (variant === 'warning' || percentage >= 80) return 'bg-warning'
      return 'bg-accent'
    }

    const getSizeClass = () => {
      switch (size) {
        case 'sm': return 'h-1'
        case 'lg': return 'h-3'
        default: return 'h-2'
      }
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className={cn('bg-bg-elevated rounded-full overflow-hidden', getSizeClass())}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              getVariantColor(),
              percentage >= 90 && percentage < 100 && 'animate-pulse-slow'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 flex justify-between text-xs text-text-secondary">
            <span>{value}{max !== 100 && ` / ${max}`}</span>
            <span>{percentage}%</span>
          </div>
        )}
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }
