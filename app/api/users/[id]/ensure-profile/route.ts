import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user role first
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult[0]

    if (user.role === "usher") {
      // Check if usher profile exists
      const profileExists = await sql`
        SELECT 1 FROM ushers WHERE user_id = ${userId}
      `

      if (profileExists.length === 0) {
        // Create usher profile if it doesn't exist
        await sql`
          INSERT INTO ushers (user_id, skills, experience_years, rating, total_gigs_completed)
          VALUES (${userId}, ARRAY['general'], 0, 0.00, 0)
        `
        console.log("Created missing usher profile for user:", userId)
        
        return NextResponse.json({
          success: true,
          message: "Usher profile created",
          profileCreated: true
        })
      }

      return NextResponse.json({
        success: true,
        message: "Usher profile already exists",
        profileCreated: false
      })
    } else if (user.role === "brand") {
      // Check if brand profile exists
      const profileExists = await sql`
        SELECT 1 FROM brands WHERE user_id = ${userId}
      `

      if (profileExists.length === 0) {
        // Create brand profile if it doesn't exist
        await sql`
          INSERT INTO brands (user_id, company_name, wallet_balance)
          VALUES (${userId}, 'Company', 0.00)
        `
        console.log("Created missing brand profile for user:", userId)
        
        return NextResponse.json({
          success: true,
          message: "Brand profile created",
          profileCreated: true
        })
      }

      return NextResponse.json({
        success: true,
        message: "Brand profile already exists",
        profileCreated: false
      })
    }

    return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
  } catch (error) {
    console.error("Profile creation error:", error)
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
} 