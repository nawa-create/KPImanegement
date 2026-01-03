import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeProgress } from '@/lib/claude/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progressData = await request.json()
    const analysis = await analyzeProgress(progressData)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze progress' },
      { status: 500 }
    )
  }
}
