import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { PasswordUtils } from "@/lib/password-utils"

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

    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ 
        error: "Phone number and password are required" 
      }, { status: 400 })
    }

    console.log("Login attempt for phone:", phone)

    // Find user by phone with profile data
    const result = await sql`
      SELECT u.*, 
             CASE 
               WHEN u.role = 'usher' THEN json_build_object(
                 'skills', ush.skills,
                 'id_verified', ush.id_verified,
                 'vcash_number', ush.vcash_number,
                 'experience_years', ush.experience_years,
                 'rating', ush.rating,
                 'total_gigs_completed', ush.total_gigs_completed
               )
               WHEN u.role = 'brand' THEN json_build_object(
                 'company_name', b.company_name,
                 'industry', b.industry,
                 'wallet_balance', b.wallet_balance,
                 'contact_person', b.contact_person
               )
             END as profile
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id AND u.role = 'usher'
      LEFT JOIN brands b ON u.id = b.user_id AND u.role = 'brand'
      WHERE u.phone = ${phone} AND u.is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    const user = result[0]
    console.log("User found:", { id: user.id, phone: user.phone, role: user.role })

    // Check if user has a password set
    if (!user.password_hash) {
      return NextResponse.json({ 
        error: "Account not set up. Please contact support to set your password." 
      }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    console.log("Password verified successfully for user:", user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        profile: user.profile,
      },
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Database tables not found",
            message: "Please run the database setup script first.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to process login", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
