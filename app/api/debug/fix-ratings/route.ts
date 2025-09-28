import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get all ushers
    const ushers = await sql`
      SELECT user_id, rating FROM ushers
    `

    const results = []

    for (const usher of ushers) {
      const usherId = usher.user_id

      // Calculate attendance statistics
      const attendanceStats = await sql`
        SELECT 
          COUNT(DISTINCT da.gig_id) as total_gigs_attended,
          COUNT(DISTINCT CASE WHEN da.is_present = true THEN da.gig_id END) as gigs_with_attendance,
          AVG(CASE WHEN da.is_present = true THEN 1.0 ELSE 0.0 END) as attendance_percentage,
          COUNT(DISTINCT s.gig_id) as total_shifts_completed
        FROM daily_attendance da
        LEFT JOIN shifts s ON da.gig_id = s.gig_id AND da.usher_id = s.usher_id 
          AND s.check_out_verified = true
        WHERE da.usher_id = ${usherId}
      `

      // Calculate brand ratings average
      const brandRatings = await sql`
        SELECT 
          AVG(brand_rating) as avg_brand_rating,
          COUNT(*) as total_brand_ratings
        FROM gig_ratings 
        WHERE usher_id = ${usherId} 
        AND brand_rating IS NOT NULL
      `

      // Calculate attendance rating (2 stars max based on attendance)
      const attendanceRating = attendanceStats[0]?.attendance_percentage 
        ? Math.min(2.0, (parseFloat(attendanceStats[0].attendance_percentage) * 2.0))
        : 0

      // Calculate brand rating (3 stars max based on brand feedback)
      const brandRatingAvg = brandRatings[0]?.avg_brand_rating 
        ? parseFloat(brandRatings[0].avg_brand_rating)
        : 0
      
      const brandRatingScaled = brandRatingAvg > 0 ? (brandRatingAvg / 5.0) * 3.0 : 0

      // Calculate final rating (out of 5 stars)
      const finalRating = Math.min(5.0, attendanceRating + brandRatingScaled)

      // Update usher's profile with calculated stats
      await sql`
        UPDATE ushers 
        SET 
          rating = ${finalRating},
          attendance_rating = ${attendanceRating},
          brand_rating_avg = ${brandRatingAvg},
          total_ratings_count = ${parseInt(brandRatings[0]?.total_brand_ratings) || 0},
          total_gigs_completed = ${parseInt(attendanceStats[0]?.total_shifts_completed) || 0}
        WHERE user_id = ${usherId}
      `

      results.push({
        usherId,
        oldRating: parseFloat(usher.rating),
        newRating: parseFloat(finalRating.toFixed(2)),
        attendanceRating: parseFloat(attendanceRating.toFixed(2)),
        brandRating: parseFloat(brandRatingScaled.toFixed(2)),
        attendancePercentage: ((parseFloat(attendanceStats[0]?.attendance_percentage) || 0) * 100).toFixed(1) + '%',
        totalBrandRatings: parseInt(brandRatings[0]?.total_brand_ratings) || 0
      })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ratings for ${results.length} ushers`,
      results
    })

  } catch (error) {
    console.error('Fix ratings error:', error)
    return NextResponse.json({
      error: 'Failed to fix ratings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
