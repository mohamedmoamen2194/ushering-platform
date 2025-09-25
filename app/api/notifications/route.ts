import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notification-service'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await notificationService.getUserNotifications(
      parseInt(userId),
      page,
      limit
    )

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Send a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, referenceId, sendWhatsApp, sendEmail } = body

    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message, type' },
        { status: 400 }
      )
    }

    const result = await notificationService.sendNotification({
      userId: parseInt(userId),
      title,
      message,
      type,
      referenceId,
      sendWhatsApp,
      sendEmail
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        notificationId: result.notificationId
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, userId, markAllAsRead } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let success = false

    if (markAllAsRead) {
      success = await notificationService.markAllAsRead(parseInt(userId))
    } else if (notificationId) {
      success = await notificationService.markAsRead(parseInt(notificationId), parseInt(userId))
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAllAsRead must be provided' },
        { status: 400 }
      )
    }

    if (success) {
      return NextResponse.json({ success: true, message: 'Notifications marked as read' })
    } else {
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
