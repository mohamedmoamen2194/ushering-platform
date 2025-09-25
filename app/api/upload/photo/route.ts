import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { sql } from '@/lib/db'

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

    const formData = await request.formData()
    const file: File | null = formData.get('photo') as unknown as File
    const userId = formData.get('userId') as string
    const userRole = formData.get('userRole') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Verify user exists and get user info
    const userResult = await sql`
      SELECT id, phone, role FROM users 
      WHERE id = ${parseInt(userId)} AND is_active = true
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `user_${userId}_${timestamp}${fileExtension}`
    const filePath = path.join(uploadDir, fileName)
    const publicUrl = `/uploads/photos/${fileName}`

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update database with photo URL
    let updateResult;
    
    if (user.role === 'usher') {
      // Update usher profile with photo
      updateResult = await sql`
        UPDATE ushers 
        SET profile_photo_url = ${publicUrl}, photo_uploaded_at = NOW()
        WHERE user_id = ${parseInt(userId)}
        RETURNING user_id
      `
    } else {
      // For brands or other roles, we might want to add a general profile photo field
      // For now, we'll store it in a file_uploads table
      updateResult = await sql`
        INSERT INTO file_uploads (user_id, file_name, file_path, file_size, file_type, upload_purpose)
        VALUES (${parseInt(userId)}, ${fileName}, ${publicUrl}, ${file.size}, ${file.type}, 'profile_photo')
        RETURNING id
      `
    }

    if (updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user profile with photo' },
        { status: 500 }
      )
    }

    // Log the upload in file_uploads table for tracking
    await sql`
      INSERT INTO file_uploads (user_id, file_name, file_path, file_size, file_type, upload_purpose)
      VALUES (${parseInt(userId)}, ${fileName}, ${publicUrl}, ${file.size}, ${file.type}, 'profile_photo')
      ON CONFLICT DO NOTHING
    `

    console.log(`✅ Photo uploaded successfully for user ${userId}: ${publicUrl}`)

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: publicUrl,
      fileName: fileName,
      fileSize: file.size
    })

  } catch (error) {
    console.error('Photo upload error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          {
            error: "Database tables not found",
            message: "Please run the enhancement migration script first.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to upload photo', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Handle GET request to retrieve user's photo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's photo from database
    const result = await sql`
      SELECT u.id, u.role, ush.profile_photo_url, ush.photo_uploaded_at
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id
      WHERE u.id = ${parseInt(userId)} AND u.is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result[0]

    return NextResponse.json({
      success: true,
      photoUrl: user.profile_photo_url,
      uploadedAt: user.photo_uploaded_at,
      hasPhoto: !!user.profile_photo_url
    })

  } catch (error) {
    console.error('Get photo error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve photo', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
