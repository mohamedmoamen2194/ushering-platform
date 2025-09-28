import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const usherId = request.nextUrl.searchParams.get('usherId')
    
    if (!usherId) {
      return NextResponse.json({ error: 'usherId parameter required' }, { status: 400 })
    }

    // Check what tables exist for rating system
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('daily_attendance', 'gig_ratings', 'ushers')
      ORDER BY table_name
    `

    // Check ushers table columns
    const usherColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ushers'
      ORDER BY ordinal_position
    `

    // Get current usher data
    const usherData = await sql`
      SELECT * FROM ushers WHERE user_id = ${parseInt(usherId)}
    `

    // Check attendance data
    const attendanceData = await sql`
      SELECT 
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN is_present = true THEN 1 END) as present_days,
        COUNT(DISTINCT gig_id) as unique_gigs
      FROM daily_attendance 
      WHERE usher_id = ${parseInt(usherId)}
    `

    // Check gig ratings data
    const ratingsData = await sql`
      SELECT 
        COUNT(*) as total_ratings,
        AVG(brand_rating) as avg_brand_rating,
        MIN(brand_rating) as min_rating,
        MAX(brand_rating) as max_rating
      FROM gig_ratings 
      WHERE usher_id = ${parseInt(usherId)}
    `

    // Check applications and gigs
    const gigsData = await sql`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_applications,
        COUNT(DISTINCT g.id) as unique_gigs_applied
      FROM applications a
      JOIN gigs g ON a.gig_id = g.id
      WHERE a.usher_id = ${parseInt(usherId)}
    `

    // Manual rating calculation
    const attendanceStats = attendanceData[0]
    const ratingsStats = ratingsData[0]
    
    const attendancePercentage = attendanceStats.total_attendance_records > 0 
      ? attendanceStats.present_days / attendanceStats.total_attendance_records 
      : 0
    
    const attendanceRating = Math.min(2.0, attendancePercentage * 2.0)
    
    const brandRatingAvg = parseFloat(ratingsStats.avg_brand_rating) || 0
    const brandRatingScaled = brandRatingAvg > 0 ? (brandRatingAvg / 5.0) * 3.0 : 0
    
    const calculatedFinalRating = Math.min(5.0, attendanceRating + brandRatingScaled)

    return NextResponse.json({
      success: true,
      debug: {
        usherId: parseInt(usherId),
        tablesExist: tablesCheck.map(t => t.table_name),
        usherColumns: usherColumns.map(c => `${c.column_name} (${c.data_type})`),
        currentUsherData: usherData[0] || null,
        attendanceStats: attendanceStats,
        ratingsStats: ratingsStats,
        gigsStats: gigsData[0],
        calculatedRating: {
          attendancePercentage: (attendancePercentage * 100).toFixed(1) + '%',
          attendanceRating: attendanceRating.toFixed(2),
          brandRatingAvg: brandRatingAvg.toFixed(2),
          brandRatingScaled: brandRatingScaled.toFixed(2),
          finalRating: calculatedFinalRating.toFixed(2)
        }
      }
    })

  } catch (error) {
    console.error('Rating debug error:', error)
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
