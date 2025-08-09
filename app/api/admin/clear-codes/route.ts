import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: "Not available in production" }, { status: 403 })
    }

    const { phone } = await request.json()

    if (phone) {
      // Clear codes for specific phone number
      const result = await sql`
        DELETE FROM verification_codes 
        WHERE phone = ${phone}
        RETURNING *
      `
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${result.length} verification codes for ${phone}`,
        cleared: result.length
      })
    } else {
      // Clear all verification codes
      const result = await sql`
        DELETE FROM verification_codes
        RETURNING *
      `
      
      return NextResponse.json({
        success: true,
        message: `Cleared all ${result.length} verification codes`,
        cleared: result.length
      })
    }

  } catch (error) {
    console.error("Clear codes error:", error)
    return NextResponse.json({ 
      error: "Failed to clear verification codes",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
