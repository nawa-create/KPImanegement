'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Plus, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'ホーム' },
  { href: '/goals', icon: Target, label: '目標' },
  { href: '/goals/new', icon: Plus, label: '追加', isAction: true },
  { href: '/analytics', icon: BarChart3, label: '分析' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/80 backdrop-blur-xl border-t border-white/5 safe-bottom">
      <div className="flex items-center justify-around px-4 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-glow"
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors',
                isActive ? 'text-accent' : 'text-text-tertiary'
              )}
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
