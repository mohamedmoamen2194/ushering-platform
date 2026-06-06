import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { sql } from '@/lib/db'
import { put, del } from '@vercel/blob'

async function uploadToStorage(buffer: Buffer, fileName: string, fileType: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(fileName, buffer, { contentType: fileType, access: 'public' })
    return blob.url
  }
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos')
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, fileName)
  await writeFile(filePath, buffer)
  return `/uploads/photos/${fileName}`
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured", message: "Please add Neon integration" }, { status: 500 })
    }

    const formData = await request.formData()
    const file: File | null = formData.get('photo') as unknown as File
    const userId = formData.get('userId') as string
    const userRole = formData.get('userRole') as string
    const photoType = (formData.get('photoType') as string) || 'profile_photo'

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and User ID are required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP allowed.' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
    }

    const userResult = await sql`
      SELECT id, phone, role FROM users WHERE id = ${parseInt(userId)} AND is_active = true
    `
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${photoType}_user_${userId}_${timestamp}${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const publicUrl = await uploadToStorage(buffer, fileName, file.type)

    if (user.role === 'usher') {
      if (photoType === 'profile_photo') {
        await sql`UPDATE ushers SET profile_photo_url = ${publicUrl}, photo_uploaded_at = NOW() WHERE user_id = ${parseInt(userId)}`
      } else if (photoType === 'id_photo') {
        await sql`UPDATE ushers SET id_photo_url = ${publicUrl}, id_photo_uploaded_at = NOW() WHERE user_id = ${parseInt(userId)}`
      }
    } else {
      if (photoType === 'profile_photo') {
        await sql`UPDATE brands SET logo_url = ${publicUrl}, logo_uploaded_at = NOW() WHERE user_id = ${parseInt(userId)}`
      }
    }

    await sql`
      INSERT INTO file_uploads (user_id, file_name, file_path, file_size, file_type, upload_purpose)
      VALUES (${parseInt(userId)}, ${fileName}, ${publicUrl}, ${file.size}, ${file.type}, ${photoType})
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: publicUrl,
      fileName,
      fileSize: file.size
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json({ error: "Database tables not found", message: "Run the migration script first." }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to upload photo', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const photoType = request.nextUrl.searchParams.get('photoType') || 'profile_photo'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await sql`
      SELECT u.id, u.role, ush.profile_photo_url, ush.photo_uploaded_at,
             ush.id_photo_url, ush.id_photo_uploaded_at
      FROM users u
      LEFT JOIN ushers ush ON u.id = ush.user_id
      WHERE u.id = ${parseInt(userId)} AND u.is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result[0]
    const url = photoType === 'id_photo' ? user.id_photo_url : user.profile_photo_url
    const uploadedAt = photoType === 'id_photo' ? user.id_photo_uploaded_at : user.photo_uploaded_at

    return NextResponse.json({
      success: true,
      photoUrl: url,
      uploadedAt,
      hasPhoto: !!url
    })

  } catch (error) {
    console.error('Get photo error:', error)
    return NextResponse.json({ error: 'Failed to retrieve photo', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
