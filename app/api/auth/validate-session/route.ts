import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required" 
      }, { status: 400 })
    }

    // Check if user exists and is active
    const result = await sql`
      SELECT id, is_active 
      FROM users 
      WHERE id = ${userId}
    `

    if (result.length === 0) {
      return NextResponse.json({ 
        valid: false,
        error: "User not found" 
      }, { status: 200 })
    }

    const user = result[0]

    if (!user.is_active) {
      return NextResponse.json({ 
        valid: false,
        error: "User account is deactivated" 
      }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      message: "Session is valid"
    })

  } catch (error) {
    console.error("Session validation error:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            valid: false,
            error: "Database tables not found",
            message: "Please run the database setup script first.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { 
        valid: false,
        error: "Failed to validate session", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 },
    )
  }
} 