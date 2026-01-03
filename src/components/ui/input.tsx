'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-text-secondary text-sm font-medium">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full bg-bg-elevated text-text-primary text-lg',
            'py-4 px-5 rounded-button',
            'border-2 border-transparent',
            'transition-all duration-200',
            'focus:outline-none focus:border-accent',
            'placeholder:text-text-tertiary',
            error && 'border-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-error text-sm">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
