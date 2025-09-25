import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notification-service'

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const preferences = await notificationService.getUserPreferences(parseInt(userId))

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, preferences } = body

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'User ID and preferences are required' },
        { status: 400 }
      )
    }

    const success = await notificationService.updateUserPreferences(
      parseInt(userId),
      preferences
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification preferences updated successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
