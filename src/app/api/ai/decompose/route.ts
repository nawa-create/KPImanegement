import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decomposeGoal } from '@/lib/claude/client'

export async function POST(request: Request) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, target_date, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const proposal = await decomposeGoal(title, target_date, description)

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Decompose error:', error)
    return NextResponse.json(
      { error: 'Failed to decompose goal' },
      { status: 500 }
    )
  }
}
