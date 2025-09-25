import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    console.log('Testing database connection...')
    
    const testResult = await sql`SELECT 1 as test`
    console.log('Database connection successful:', testResult)

    // Test if new tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('gig_messages', 'gig_ratings', 'daily_attendance', 'file_uploads')
      ORDER BY table_name
    `
    console.log('New tables found:', tablesResult)

    // Test if new columns exist in ushers table
    const usherColumnsResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ushers'
      AND column_name IN ('profile_photo_url', 'photo_uploaded_at', 'attendance_rating', 'brand_rating_avg', 'total_ratings_count')
      ORDER BY column_name
    `
    console.log('New columns in ushers table:', usherColumnsResult)

    // Check what columns exist in gigs table
    const gigColumnsResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gigs'
      ORDER BY column_name
    `
    console.log('All columns in gigs table:', gigColumnsResult)

    // Test basic user query
    const usersResult = await sql`
      SELECT u.id, u.name, u.role 
      FROM users u 
      WHERE u.role = 'usher' 
      LIMIT 3
    `
    console.log('Sample ushers:', usersResult)

    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      results: {
        connection: testResult,
        newTables: tablesResult,
        usherColumns: usherColumnsResult,
        gigColumns: gigColumnsResult,
        sampleUshers: usersResult
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
