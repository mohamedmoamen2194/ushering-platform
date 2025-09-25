import { NextRequest, NextResponse } from 'next/server'
import { ratingService } from '@/lib/rating-service'

// POST /api/ratings - Submit a rating for an usher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gigId, usherId, brandRating, attendanceDays, totalGigDays, ratingNotes } = body

    // Validate required fields
    if (!gigId || !usherId || !brandRating || attendanceDays === undefined || !totalGigDays) {
      return NextResponse.json(
        { error: 'Missing required fields: gigId, usherId, brandRating, attendanceDays, totalGigDays' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (brandRating < 1 || brandRating > 5) {
      return NextResponse.json(
        { error: 'Brand rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate attendance
    if (attendanceDays < 0 || totalGigDays <= 0 || attendanceDays > totalGigDays) {
      return NextResponse.json(
        { error: 'Invalid attendance data' },
        { status: 400 }
      )
    }

    const result = await ratingService.submitRating({
      gigId: parseInt(gigId),
      usherId: parseInt(usherId),
      brandRating: parseInt(brandRating),
      attendanceDays: parseInt(attendanceDays),
      totalGigDays: parseInt(totalGigDays),
      ratingNotes
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        rating: result.rating
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error submitting rating:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

// GET /api/ratings - Get rating information
export async function GET(request: NextRequest) {
  try {
    const gigId = request.nextUrl.searchParams.get('gigId')
    const usherId = request.nextUrl.searchParams.get('usherId')
    const topRated = request.nextUrl.searchParams.get('topRated')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')

    if (topRated === 'true') {
      // Get top-rated ushers
      const topUshers = await ratingService.getTopRatedUshers(limit)
      return NextResponse.json({
        success: true,
        ushers: topUshers
      })
    }

    if (gigId && usherId) {
      // Get specific gig rating
      const rating = await ratingService.getGigRating(parseInt(gigId), parseInt(usherId))
      return NextResponse.json({
        success: true,
        rating
      })
    }

    if (usherId) {
      // Get usher rating stats
      const stats = await ratingService.getUsherRatingStats(parseInt(usherId))
      return NextResponse.json({
        success: true,
        stats
      })
    }

    return NextResponse.json(
      { error: 'Invalid parameters. Provide gigId+usherId, usherId, or topRated=true' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}
