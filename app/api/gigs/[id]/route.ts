import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gigId = parseInt(params.id)
    const userId = request.nextUrl.searchParams.get("userId")

    if (isNaN(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    let appStatusSql = sql`NULL as application_status`
    if (userId) {
      appStatusSql = sql`
        (SELECT status FROM applications a WHERE a.gig_id = g.id AND a.usher_id = ${userId} ORDER BY a.applied_at DESC LIMIT 1) as application_status
      `
    }

    const result = await sql`
      SELECT g.*, u.name as brand_name, b.company_name, u.email as brand_email,
             (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_ushers,
             (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'pending') as pending_applications,
             to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'HH24:MI') as start_time_24h,
             to_char((g.start_datetime AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') as start_date_display,
             ${appStatusSql}
      FROM gigs g
      JOIN users u ON g.brand_id = u.id
      JOIN brands b ON u.id = b.user_id
      WHERE g.id = ${gigId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    return NextResponse.json({ gig: result[0] })
  } catch (error) {
    console.error('Gig fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch gig' }, { status: 500 })
  }
}
