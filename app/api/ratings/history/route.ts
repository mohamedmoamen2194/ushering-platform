import { NextRequest, NextResponse } from 'next/server'
import { ratingService } from '@/lib/rating-service'

// GET /api/ratings/history - Get rating history for an usher
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usherId = searchParams.get('usherId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!usherId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const history = await ratingService.getUsherRatingHistory(parseInt(usherId), limit)

    return NextResponse.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('Error fetching rating history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rating history' },
      { status: 500 }
    )
  }
}
