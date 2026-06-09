import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const result = await sql`
      SELECT reference_id::int as gig_id, COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = ${userId}
        AND type IN ('gig_message', 'gig_announcement')
        AND is_read = false
      GROUP BY reference_id
    `

    const unreadMap: Record<number, number> = {}
    for (const row of result) {
      unreadMap[row.gig_id] = parseInt(row.unread_count)
    }

    return NextResponse.json({ success: true, unread: unreadMap })
  } catch (error) {
    console.error('Get unread chats error:', error)
    return NextResponse.json({ error: 'Failed to get unread counts' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const body = await request.json()
    const gigId = parseInt(body.gigId)

    if (isNaN(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ${userId}
        AND type IN ('gig_message', 'gig_announcement')
        AND reference_id = ${gigId.toString()}
        AND is_read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark chats read error:', error)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
