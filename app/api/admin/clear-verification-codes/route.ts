import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { phone, clearAll } = await request.json()

    if (clearAll) {
      // Clear all verification codes (for testing)
      const result = await sql`
        DELETE FROM verification_codes
        RETURNING *
      `
      
      return NextResponse.json({
        success: true,
        message: `Cleared all ${result.length} verification codes`,
        cleared: result.length
      })
    } else if (phone) {
      // Clear codes for specific phone number (try multiple formats)
      const result = await sql`
        DELETE FROM verification_codes 
        WHERE phone IN (${phone}, ${`+${phone}`}, ${phone.replace('+', '')})
        RETURNING *
      `
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${result.length} verification codes for ${phone}`,
        cleared: result.length
      })
    } else {
      return NextResponse.json({ error: "Phone number or clearAll flag required" }, { status: 400 })
    }

  } catch (error) {
    console.error("Clear verification codes error:", error)
    return NextResponse.json({ 
      error: "Failed to clear verification codes",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
