'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card p-5',
          {
            'bg-bg-tertiary shadow-card': variant === 'default',
            'bg-bg-elevated shadow-card': variant === 'elevated',
            'bg-bg-tertiary shadow-card transition-all duration-200 hover:bg-bg-elevated active:scale-[0.98]':
              variant === 'interactive',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
