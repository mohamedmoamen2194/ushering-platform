import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gigId = params.id
    const { brandId, ratings } = await request.json()

    if (!gigId || !brandId || !ratings || !Array.isArray(ratings)) {
      return NextResponse.json({ 
        error: "Gig ID, Brand ID, and ratings array are required" 
      }, { status: 400 })
    }

    // Verify the gig belongs to this brand and is completed
    const gigResult = await sql`
      SELECT id, status, end_date FROM gigs 
      WHERE id = ${gigId} AND brand_id = ${brandId}
    `

    if (gigResult.length === 0) {
      return NextResponse.json({ error: "Gig not found or access denied" }, { status: 404 })
    }

    const gig = gigResult[0]

    if (gig.status !== 'completed') {
      return NextResponse.json({ 
        error: "Can only rate ushers for completed gigs" 
      }, { status: 400 })
    }

    // Check if gig end date has passed
    const now = new Date()
    const gigEndDate = new Date(gig.end_date)
    if (now < gigEndDate) {
      return NextResponse.json({ 
        error: "Cannot rate ushers until gig end date has passed" 
      }, { status: 400 })
    }

    const results = []

    for (const rating of ratings) {
      const { usherId, rating: ratingValue, feedback } = rating

      if (!usherId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
        results.push({
          usherId,
          success: false,
          error: "Invalid rating value (must be 1-5)"
        })
        continue
      }

      try {
        // Check if usher was approved and attended this gig
        const attendanceResult = await sql`
          SELECT s.id, s.attendance_status, s.check_in_verified, s.check_out_verified
          FROM shifts s
          JOIN applications a ON s.gig_id = a.gig_id AND s.usher_id = a.usher_id
          WHERE s.gig_id = ${gigId} 
          AND s.usher_id = ${usherId}
          AND a.status = 'approved'
        `

        if (attendanceResult.length === 0) {
          results.push({
            usherId,
            success: false,
            error: "Usher not found or not approved for this gig"
          })
          continue
        }

        const attendance = attendanceResult[0]

        if (attendance.attendance_status === 'no_show') {
          results.push({
            usherId,
            success: false,
            error: "Cannot rate usher who did not attend"
          })
          continue
        }

        // Insert or update rating
        await sql`
          INSERT INTO usher_ratings (gig_id, usher_id, brand_id, rating, feedback)
          VALUES (${gigId}, ${usherId}, ${brandId}, ${ratingValue}, ${feedback || null})
          ON CONFLICT (gig_id, usher_id, brand_id) 
          DO UPDATE SET 
            rating = EXCLUDED.rating,
            feedback = EXCLUDED.feedback,
            rated_at = NOW()
        `

        // Update usher's average rating
        const avgRatingResult = await sql`
          SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
          FROM usher_ratings 
          WHERE usher_id = ${usherId}
        `

        if (avgRatingResult.length > 0) {
          const avgRating = avgRatingResult[0]
          await sql`
            UPDATE ushers 
            SET rating = ${Number.parseFloat(avgRating.avg_rating) || 0}
            WHERE user_id = ${usherId}
          `
        }

        results.push({
          usherId,
          success: true,
          rating: ratingValue,
          feedback: feedback || null
        })

      } catch (error) {
        console.error(`Error rating usher ${usherId}:`, error)
        results.push({
          usherId,
          success: false,
          error: "Failed to process rating"
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rating process completed",
      results
    })

  } catch (error) {
    console.error("Rate ushers error:", error)
    return NextResponse.json({ error: "Failed to process ratings" }, { status: 500 })
  }
}

// Get ushers who can be rated for a gig
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gigId = params.id
    const brandId = request.nextUrl.searchParams.get('brandId')

    if (!gigId || !brandId) {
      return NextResponse.json({ error: "Gig ID and Brand ID are required" }, { status: 400 })
    }

    // Get ushers who attended this gig and can be rated
    const ushersResult = await sql`
      SELECT 
        u.id as usher_id,
        u.name as usher_name,
        s.attendance_status,
        s.check_in_time,
        s.check_out_time,
        s.hours_worked,
        s.payout_amount,
        ur.rating as existing_rating,
        ur.feedback as existing_feedback
      FROM users u
      JOIN applications a ON u.id = a.usher_id
      LEFT JOIN shifts s ON a.gig_id = s.gig_id AND a.usher_id = s.usher_id
      LEFT JOIN usher_ratings ur ON a.gig_id = ur.gig_id AND a.usher_id = ur.usher_id AND ur.brand_id = ${brandId}
      WHERE a.gig_id = ${gigId} 
      AND a.status = 'approved'
      AND u.role = 'usher'
      ORDER BY u.name
    `

    return NextResponse.json({
      success: true,
      ushers: ushersResult.map(u => ({
        usherId: u.usher_id,
        usherName: u.usher_name,
        attendanceStatus: u.attendance_status,
        checkInTime: u.check_in_time,
        checkOutTime: u.check_out_time,
        hoursWorked: u.hours_worked,
        payoutAmount: u.payout_amount,
        existingRating: u.existing_rating,
        existingFeedback: u.existing_feedback
      }))
    })

  } catch (error) {
    console.error("Get rateable ushers error:", error)
    return NextResponse.json({ error: "Failed to fetch ushers" }, { status: 500 })
  }
} 