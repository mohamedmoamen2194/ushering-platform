import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Check what columns exist in the ushers table
    const usherColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ushers' 
      ORDER BY ordinal_position
    `

    // Check what columns exist in the gigs table
    const gigColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' 
      ORDER BY ordinal_position
    `

    // Check if gig_messages table exists
    const gigMessagesTable = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gig_messages' 
      ORDER BY ordinal_position
    `

    // Check what tables exist
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Try a simple query to see if it works
    const testQuery = await sql`
      SELECT 
        u.id,
        u.name,
        ush.rating,
        ush.experience_years
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id
      WHERE u.role = 'usher'
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      usherColumns: usherColumns,
      gigColumns: gigColumns,
      gigMessagesColumns: gigMessagesTable,
      allTables: allTables.map(t => t.table_name),
      testQuery: testQuery
    })

  } catch (error) {
    console.error('Debug check error:', error)
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
