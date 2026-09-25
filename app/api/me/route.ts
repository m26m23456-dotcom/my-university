import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handle } from '@/lib/api'

export const GET = handle(async () => {
  return NextResponse.json({ user: await getCurrentUser() })
})
