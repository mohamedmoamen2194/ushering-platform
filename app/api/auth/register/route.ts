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

    const body = await request.json()
    const { phone, name, email, role, language = "ar", password, ...profileData } = body

    console.log("Registration attempt:", { phone, name, role, language })

    // Validate required fields
    if (!phone || !name || !role || !password) {
      return NextResponse.json({ 
        error: "Missing required fields: phone, name, role, password" 
      }, { status: 400 })
    }

    // Validate password strength
    const passwordStrength = PasswordUtils.checkPasswordStrength(password)
    if (!passwordStrength.isStrong) {
      return NextResponse.json({ 
        error: "Password is too weak",
        feedback: passwordStrength.feedback
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE phone = ${phone}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 })
    }

    // Hash the password
    const passwordHash = await PasswordUtils.hashPassword(password)

    // Create user with password
    const userResult = await sql`
      INSERT INTO users (phone, name, email, role, language, password_hash)
      VALUES (${phone}, ${name}, ${email || null}, ${role}, ${language}, ${passwordHash})
      RETURNING id, phone, name, role, language
    `

    const user = userResult[0]
    console.log("User created:", user)

    // Create role-specific profile
    if (role === "usher") {
      await sql`
        INSERT INTO ushers (user_id, skills, experience_years, vcash_number)
        VALUES (
          ${user.id}, 
          ${profileData.skills || []}, 
          ${Number.parseInt(profileData.experienceYears) || 0}, 
          ${profileData.vcashNumber || null}
        )
      `
      console.log("Usher profile created for user:", user.id)
    } else if (role === "brand") {
      await sql`
        INSERT INTO brands (user_id, company_name, industry, contact_person, tax_id)
        VALUES (
          ${user.id}, 
          ${profileData.companyName || name}, 
          ${profileData.industry || null}, 
          ${name}, 
          ${profileData.taxId || null}
        )
      `
      console.log("Brand profile created for user:", user.id)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
      },
      message: "Account created successfully. You can now login with your phone number and password.",
    })
  } catch (error) {
    console.error("Registration error:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 })
      }

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
      { error: "Failed to create account", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
