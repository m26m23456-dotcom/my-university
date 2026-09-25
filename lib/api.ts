import 'server-only'
import { NextResponse } from 'next/server'
import { HttpError } from '@/lib/auth'

export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      console.error(error)
      return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
    }
  }
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new HttpError(400, 'بيانات غير صالحة')
  }
}
