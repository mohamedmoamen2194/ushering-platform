import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// POST - Mark a gig as completed and finalize all shifts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gigId = parseInt(params.id)
    
    if (isNaN(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    const { brandId } = await request.json()

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Verify brand owns this gig
    const gigCheck = await sql`
      SELECT id, title, status FROM gigs 
      WHERE id = ${gigId} AND brand_id = ${parseInt(brandId)}
    `

    if (gigCheck.length === 0) {
      return NextResponse.json({ error: 'Gig not found or access denied' }, { status: 404 })
    }

    const gig = gigCheck[0]

    // Mark all shifts for this gig as completed if they have both check-in and check-out
    const completedShifts = await sql`
      UPDATE shifts 
      SET payout_status = 'completed'
      WHERE gig_id = ${gigId} 
      AND check_in_verified = true 
      AND check_out_verified = true
      AND payout_status != 'completed'
      RETURNING id, usher_id, payout_amount
    `

    // Update gig status to completed
    await sql`
      UPDATE gigs 
      SET status = 'completed'
      WHERE id = ${gigId}
    `

    // Calculate and update attendance ratings for each usher
    const attendanceData = await sql`
      SELECT 
        da.usher_id,
        COUNT(*) as days_attended,
        g.total_days,
        CASE 
          WHEN g.total_days > 0 THEN (COUNT(*)::decimal / g.total_days::decimal) * 2.0
          ELSE 0
        END as attendance_rating
      FROM daily_attendance da
      JOIN gigs g ON da.gig_id = g.id
      WHERE da.gig_id = ${gigId} AND da.is_present = true
      GROUP BY da.usher_id, g.total_days
    `

    // Update attendance ratings in gig_ratings table and trigger overall rating updates
    for (const attendance of attendanceData) {
      await sql`
        INSERT INTO gig_ratings (gig_id, usher_id, attendance_days, total_gig_days, attendance_rating)
        VALUES (${gigId}, ${attendance.usher_id}, ${attendance.days_attended}, ${attendance.total_days}, ${attendance.attendance_rating})
        ON CONFLICT (gig_id, usher_id)
        DO UPDATE SET 
          attendance_days = ${attendance.days_attended},
          total_gig_days = ${attendance.total_days},
          attendance_rating = ${attendance.attendance_rating}
      `

      // Update usher's overall rating
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users/${attendance.usher_id}/update-rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.log(`Rating update failed for usher ${attendance.usher_id} (non-critical):`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Gig "${gig.title}" marked as completed`,
      completedShifts: completedShifts.length,
      attendanceRecords: attendanceData.length
    })

  } catch (error) {
    console.error('Complete gig error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to complete gig', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
