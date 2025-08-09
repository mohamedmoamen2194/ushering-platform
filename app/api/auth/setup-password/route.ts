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

    const { phone, password, confirmPassword } = await request.json()

    if (!phone || !password || !confirmPassword) {
      return NextResponse.json({ 
        error: "Phone number, password, and password confirmation are required" 
      }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ 
        error: "Passwords do not match" 
      }, { status: 400 })
    }

    // Check password strength
    const strengthCheck = PasswordUtils.checkPasswordStrength(password)
    if (!strengthCheck.isStrong) {
      return NextResponse.json({ 
        error: "Password is too weak",
        feedback: strengthCheck.feedback
      }, { status: 400 })
    }

    console.log("Password setup attempt for phone:", phone)

    // Find user by phone
    const result = await sql`
      SELECT id, phone, role, password_hash
      FROM users 
      WHERE phone = ${phone} AND is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result[0]
    console.log("User found for password setup:", { id: user.id, phone: user.phone, role: user.role })

    // Check if user already has a password
    if (user.password_hash) {
      return NextResponse.json({ 
        error: "Password already set. Use the login page instead." 
      }, { status: 400 })
    }

    // Hash the password
    const passwordHash = await PasswordUtils.hashPassword(password)

    // Update user with password hash
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    console.log("Password set successfully for user:", user.id)

    return NextResponse.json({
      success: true,
      message: "Password set successfully. You can now log in.",
    })
  } catch (error) {
    console.error("Password setup error:", error)

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
      {
        error: "Internal server error",
        message: "An unexpected error occurred while setting up your password.",
      },
      { status: 500 },
    )
  }
} 