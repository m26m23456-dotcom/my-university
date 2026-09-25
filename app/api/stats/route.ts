import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { handle } from '@/lib/api'

export const GET = handle(async () => {
  await requireOwner()
  const result = await db.execute<{
    total_visitors: number
    today_visitors: number
    week_visitors: number
    total_hits: number
    files_bytes: number
    files_count: number
    image_bytes: number
    video_bytes: number
    pdf_bytes: number
    db_bytes: number
    posts_count: number
    subscribers: number
  }>(sql`
    select
      (select count(distinct visitor_id)::int from visits) as total_visitors,
      (select count(*)::int from visits where day = current_date) as today_visitors,
      (select count(distinct visitor_id)::int from visits where day > current_date - 7) as week_visitors,
      (select coalesce(sum(hits), 0)::int from visits) as total_hits,
      (select coalesce(sum(size), 0)::bigint from files where post_id is not null) as files_bytes,
      (select count(*)::int from files where post_id is not null) as files_count,
      (select coalesce(sum(size), 0)::bigint from files where post_id is not null and mime like 'image/%') as image_bytes,
      (select coalesce(sum(size), 0)::bigint from files where post_id is not null and mime like 'video/%') as video_bytes,
      (select coalesce(sum(size), 0)::bigint from files where post_id is not null and mime = 'application/pdf') as pdf_bytes,
      (select pg_database_size(current_database())::bigint) as db_bytes,
      (select count(*)::int from posts) as posts_count,
      (select count(*)::int from push_subscriptions where cardinality(topics) > 0) as subscribers
  `)
  const daily = await db.execute<{ day: string; visitors: number }>(sql`
    select to_char(d, 'YYYY-MM-DD') as day, coalesce(v.visitors, 0)::int as visitors
    from generate_series(current_date - 13, current_date, interval '1 day') as d
    left join (select day, count(*) as visitors from visits group by day) v on v.day = d::date
    order by d
  `)
  const row = result.rows[0]
  const numeric = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]))
  return NextResponse.json({ stats: numeric, daily: daily.rows })
})
