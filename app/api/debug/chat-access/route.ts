import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const gigId = request.nextUrl.searchParams.get('gigId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!gigId || !userId) {
      return NextResponse.json({ 
        error: 'gigId and userId are required as query parameters' 
      }, { status: 400 })
    }

    // Check if gig exists
    const gigCheck = await sql`
      SELECT id, title, brand_id, status, created_at
      FROM gigs 
      WHERE id = ${parseInt(gigId)}
    `

    // Check if user exists
    const userCheck = await sql`
      SELECT id, name, role, phone
      FROM users 
      WHERE id = ${parseInt(userId)}
    `

    // Check applications for this user and gig
    const applicationCheck = await sql`
      SELECT id, status, applied_at, reviewed_at
      FROM applications 
      WHERE gig_id = ${parseInt(gigId)} AND usher_id = ${parseInt(userId)}
    `

    // Check if user is the brand owner
    const brandOwnerCheck = gigCheck.length > 0 && gigCheck[0].brand_id === parseInt(userId)

    // Check access type
    let accessType = 'none'
    if (brandOwnerCheck) {
      accessType = 'brand'
    } else if (applicationCheck.length > 0 && applicationCheck[0].status === 'approved') {
      accessType = 'usher'
    }

    return NextResponse.json({
      success: true,
      debug: {
        gigId: parseInt(gigId),
        userId: parseInt(userId),
        gigExists: gigCheck.length > 0,
        userExists: userCheck.length > 0,
        gigData: gigCheck[0] || null,
        userData: userCheck[0] || null,
        applicationData: applicationCheck[0] || null,
        brandOwnerCheck,
        accessType,
        canAccessChat: accessType !== 'none'
      }
    })

  } catch (error) {
    console.error('Debug chat access error:', error)
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
