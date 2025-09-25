import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "Please add Neon integration to connect the database",
        },
        { status: 500 },
      )
    }

    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Verify user exists and is an usher
    const userResult = await sql`
      SELECT u.id, u.name, u.role, ush.rating, ush.total_gigs_completed, ush.profile_photo_url
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id
      WHERE u.id = ${userId} AND u.role = 'usher' AND u.is_active = true
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'Usher not found' }, { status: 404 })
    }

    const usher = userResult[0]

    // Get usher's gig history with detailed information (simplified query)
    const gigHistory = await sql`
      SELECT 
        g.id,
        g.title,
        g.description,
        g.location,
        g.start_datetime as start_datetime,
        g.duration_hours,
        g.pay_rate,
        g.status as gig_status,
        u_brand.name as brand_name,
        b.company_name,
        a.status as application_status,
        a.applied_at,
        a.reviewed_at
      FROM applications a
      JOIN gigs g ON a.gig_id = g.id
      JOIN users u_brand ON g.brand_id = u_brand.id
      JOIN brands b ON u_brand.id = b.user_id
      WHERE a.usher_id = ${userId}
      ORDER BY g.start_datetime DESC
      LIMIT 20
    `

    // Get performance statistics (simplified)
    const performanceStats = await sql`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_applications,
        COUNT(CASE WHEN g.status = 'completed' AND a.status = 'approved' THEN 1 END) as completed_gigs
      FROM applications a
      JOIN gigs g ON a.gig_id = g.id
      WHERE a.usher_id = ${userId}
    `

    const stats = performanceStats[0] || {}

    // For now, return empty feedback array since gig_ratings table might not have data yet
    const recentFeedback = []

    // Calculate reliability score (simplified)
    const reliabilityScore = stats.total_applications > 0 
      ? Math.round((stats.approved_applications / stats.total_applications) * 100)
      : 0

    return NextResponse.json({
      success: true,
      usher: {
        id: usher.id,
        name: usher.name,
        rating: usher.rating,
        totalGigsCompleted: usher.total_gigs_completed,
        profilePhotoUrl: usher.profile_photo_url
      },
      gigHistory: gigHistory.map(gig => ({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        location: gig.location,
        startDateTime: gig.start_datetime,
        durationHours: gig.duration_hours,
        payRate: gig.pay_rate,
        gigStatus: gig.gig_status,
        brandName: gig.brand_name,
        companyName: gig.company_name,
        applicationStatus: gig.application_status,
        appliedAt: gig.applied_at,
        reviewedAt: gig.reviewed_at,
        // These fields will be null for now since we simplified the query
        checkInTime: null,
        checkOutTime: null,
        hoursWorked: null,
        payoutAmount: null,
        payoutStatus: null,
        brandRating: null,
        attendanceRating: null,
        finalRating: null,
        ratingNotes: null,
        attendanceDays: null,
        totalGigDays: null,
        attendancePercentage: null
      })),
      performanceStats: {
        totalApplications: parseInt(stats.total_applications) || 0,
        approvedApplications: parseInt(stats.approved_applications) || 0,
        completedGigs: parseInt(stats.completed_gigs) || 0,
        attendedGigs: 0, // Will be calculated later when we have shifts data
        averageRating: usher.rating || 0,
        averageAttendance: 0, // Will be calculated later
        totalEarnings: 0, // Will be calculated later
        reliabilityScore: reliabilityScore,
        approvalRate: stats.total_applications > 0 
          ? Math.round((stats.approved_applications / stats.total_applications) * 100)
          : 0
      },
      recentFeedback: [] // Empty for now since we simplified the query
    })

  } catch (error) {
    console.error('Get usher history error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          {
            error: "Database tables not found",
            message: "Please run the enhancement migration script first.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to retrieve usher history', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
