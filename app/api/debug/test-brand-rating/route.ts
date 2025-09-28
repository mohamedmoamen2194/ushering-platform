import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { gigId, usherId, brandRating, attendanceDays, totalGigDays } = await request.json()

    if (!gigId || !usherId || !brandRating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate the rating components
    const attendanceRating = (attendanceDays / totalGigDays) * 2.0
    const brandRatingStars = (brandRating / 5.0) * 3.0
    const finalRating = Math.min(5.0, attendanceRating + brandRatingStars)

    // Insert into gig_ratings table
    const result = await sql`
      INSERT INTO gig_ratings (
        gig_id, usher_id, brand_rating, attendance_days, total_gig_days,
        attendance_rating, brand_rating_stars, final_rating, rating_notes
      )
      VALUES (
        ${gigId}, ${usherId}, ${brandRating}, ${attendanceDays}, ${totalGigDays},
        ${attendanceRating}, ${brandRatingStars}, ${finalRating}, 'Test rating'
      )
      ON CONFLICT (gig_id, usher_id)
      DO UPDATE SET
        brand_rating = ${brandRating},
        attendance_days = ${attendanceDays},
        total_gig_days = ${totalGigDays},
        attendance_rating = ${attendanceRating},
        brand_rating_stars = ${brandRatingStars},
        final_rating = ${finalRating},
        rating_notes = 'Test rating updated'
      RETURNING *
    `

    // Trigger overall rating recalculation
    const allRatings = await sql`
      SELECT 
        AVG(final_rating) as avg_final_rating,
        AVG(attendance_rating) as avg_attendance_rating,
        AVG(brand_rating_stars) as avg_brand_rating_stars,
        COUNT(*) as total_ratings
      FROM gig_ratings 
      WHERE usher_id = ${usherId}
    `

    // Update usher's overall rating
    await sql`
      UPDATE ushers 
      SET 
        rating = ${parseFloat(allRatings[0].avg_final_rating)},
        attendance_rating = ${parseFloat(allRatings[0].avg_attendance_rating)},
        brand_rating_avg = ${parseFloat(allRatings[0].avg_brand_rating_stars)},
        total_ratings_count = ${parseInt(allRatings[0].total_ratings)}
      WHERE user_id = ${usherId}
    `

    return NextResponse.json({
      success: true,
      message: 'Test rating submitted successfully',
      gigRating: result[0],
      overallStats: allRatings[0],
      calculation: {
        attendanceRating: attendanceRating.toFixed(2),
        brandRatingStars: brandRatingStars.toFixed(2),
        finalRating: finalRating.toFixed(2)
      }
    })

  } catch (error) {
    console.error('Test brand rating error:', error)
    return NextResponse.json({
      error: 'Failed to submit test rating',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
