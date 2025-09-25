import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const gigId = request.nextUrl.searchParams.get('gigId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!gigId || !userId) {
      return NextResponse.json({ error: 'gigId and userId are required' }, { status: 400 })
    }

    console.log(`🔍 Debug: Checking access for user ${userId} to gig ${gigId}`)

    // Check if gig exists
    const gigExists = await sql`
      SELECT id, title, brand_id, status FROM gigs WHERE id = ${parseInt(gigId)}
    `
    console.log('🎯 Gig exists:', gigExists)

    // Check if user exists
    const userExists = await sql`
      SELECT id, name, role FROM users WHERE id = ${parseInt(userId)}
    `
    console.log('👤 User exists:', userExists)

    // Check applications for this gig and user
    const applications = await sql`
      SELECT id, gig_id, usher_id, status, applied_at
      FROM applications 
      WHERE gig_id = ${parseInt(gigId)} AND usher_id = ${parseInt(userId)}
    `
    console.log('📝 Applications:', applications)

    // Check all applications for this gig
    const allApplications = await sql`
      SELECT a.id, a.gig_id, a.usher_id, a.status, u.name as usher_name
      FROM applications a
      JOIN users u ON a.usher_id = u.id
      WHERE a.gig_id = ${parseInt(gigId)}
    `
    console.log('📋 All applications for gig:', allApplications)

    // Check all gigs in the system
    const allGigs = await sql`
      SELECT id, title, status, start_datetime, duration_hours,
             CASE 
               WHEN start_datetime IS NOT NULL AND duration_hours IS NOT NULL THEN
                 CASE 
                   WHEN (start_datetime + INTERVAL '1 hour' * duration_hours) < NOW() THEN 'expired'
                   ELSE 'active'
                 END
               ELSE 'unknown'
             END as time_status
      FROM gigs 
      ORDER BY id DESC
      LIMIT 10
    `
    console.log('🎪 Recent gigs in system:', allGigs)

    // Check all applications for this user
    const userApplications = await sql`
      SELECT a.id, a.gig_id, a.status, g.title, g.status as gig_status
      FROM applications a
      LEFT JOIN gigs g ON a.gig_id = g.id
      WHERE a.usher_id = ${parseInt(userId)}
      ORDER BY a.applied_at DESC
    `
    console.log('📝 All applications for user:', userApplications)

    // Check access logic
    const accessCheck = await sql`
      SELECT 
        CASE 
          WHEN g.brand_id = ${parseInt(userId)} THEN 'brand'
          WHEN EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.gig_id = ${parseInt(gigId)} 
            AND a.usher_id = ${parseInt(userId)} 
            AND a.status = 'approved'
          ) THEN 'usher'
          ELSE 'none'
        END as access_type,
        g.title as gig_title
      FROM gigs g
      WHERE g.id = ${parseInt(gigId)}
    `
    console.log('🔐 Access check:', accessCheck)

    return NextResponse.json({
      success: true,
      debug: {
        gigId: parseInt(gigId),
        userId: parseInt(userId),
        gigExists: gigExists,
        userExists: userExists,
        applications: applications,
        allApplications: allApplications,
        allGigs: allGigs,
        userApplications: userApplications,
        accessCheck: accessCheck
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
