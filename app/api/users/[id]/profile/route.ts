import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    const userResult = await sql`
      SELECT id, role FROM users WHERE id = ${userId}
    `
    if (userResult.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const user = userResult[0]
    let profile: any = {}

    if (user.role === "usher") {
      const result = await sql`
        SELECT * FROM ushers WHERE user_id = ${userId}
      `
      if (result.length > 0) profile = result[0]
    } else if (user.role === "brand") {
      const result = await sql`
        SELECT * FROM brands WHERE user_id = ${userId}
      `
      if (result.length > 0) profile = result[0]
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    const body = await request.json()
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `
    if (userResult.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const role = userResult[0].role

    if (body.payment_method !== undefined && role === "usher") {
      await sql`
        UPDATE ushers SET
          payment_method = ${JSON.stringify(body.payment_method)}::jsonb,
          payment_method_set = ${body.payment_method_set || false}
        WHERE user_id = ${parseInt(userId)}
      `
    }

    if (body.profile_photo_url !== undefined && role === "usher") {
      await sql`
        UPDATE ushers SET profile_photo_url = ${body.profile_photo_url}, photo_uploaded_at = NOW() WHERE user_id = ${parseInt(userId)}
      `
    }

    if (body.id_photo_url !== undefined && role === "usher") {
      await sql`
        UPDATE ushers SET id_photo_url = ${body.id_photo_url}, id_photo_uploaded_at = NOW() WHERE user_id = ${parseInt(userId)}
      `
    }

    if (body.name !== undefined) await sql`UPDATE users SET name = ${body.name} WHERE id = ${parseInt(userId)}`
    if (body.email !== undefined) await sql`UPDATE users SET email = ${body.email} WHERE id = ${parseInt(userId)}`
    if (body.phone !== undefined) await sql`UPDATE users SET phone = ${body.phone} WHERE id = ${parseInt(userId)}`

    if (role === "brand") {
      if (body.company_name !== undefined) await sql`UPDATE brands SET company_name = ${body.company_name} WHERE user_id = ${parseInt(userId)}`
      if (body.company_description !== undefined) await sql`UPDATE brands SET company_description = ${body.company_description} WHERE user_id = ${parseInt(userId)}`
      if (body.company_website !== undefined) await sql`UPDATE brands SET company_website = ${body.company_website} WHERE user_id = ${parseInt(userId)}`
      if (body.company_phone !== undefined) await sql`UPDATE brands SET company_phone = ${body.company_phone} WHERE user_id = ${parseInt(userId)}`
      if (body.industry !== undefined) await sql`UPDATE brands SET industry = ${body.industry} WHERE user_id = ${parseInt(userId)}`
      if (body.tax_id !== undefined) await sql`UPDATE brands SET tax_id = ${body.tax_id} WHERE user_id = ${parseInt(userId)}`
      if (body.contact_person !== undefined) await sql`UPDATE brands SET contact_person = ${body.contact_person} WHERE user_id = ${parseInt(userId)}`
    }

    return NextResponse.json({ success: true, message: "Profile updated" })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
