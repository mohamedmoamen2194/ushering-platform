import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notification-service'

// GET /api/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const count = await notificationService.getUnreadCount(parseInt(userId))

    return NextResponse.json({
      success: true,
      count
    })

  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}
