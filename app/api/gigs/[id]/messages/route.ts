import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET - Fetch messages for a specific gig
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gigId = parseInt(params.id)
    
    if (isNaN(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    // Get query parameters
    const userId = request.nextUrl.searchParams.get('userId')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify user has access to this gig (either brand owner or approved usher)
    // Allow access to expired/completed gigs for post-gig communication
    console.log(`🔍 Chat access check: gigId=${gigId}, userId=${userId}`)
    
    let accessCheck
    try {
      accessCheck = await sql`
        SELECT 
          CASE 
            WHEN g.brand_id = ${parseInt(userId)} THEN 'brand'
            WHEN EXISTS (
              SELECT 1 FROM applications a 
              WHERE a.gig_id = ${gigId} 
              AND a.usher_id = ${parseInt(userId)} 
              AND a.status = 'approved'
            ) THEN 'usher'
            ELSE 'none'
          END as access_type,
          g.title as gig_title,
          COALESCE(g.status, 'active') as gig_status,
          g.brand_id,
          g.id as gig_exists
        FROM gigs g
        WHERE g.id = ${gigId}
      `
      
      console.log(`✅ Access check query successful: ${accessCheck.length} results`)
      if (accessCheck.length > 0) {
        console.log(`📊 Access result:`, {
          access_type: accessCheck[0].access_type,
          gig_title: accessCheck[0].gig_title,
          brand_id: accessCheck[0].brand_id,
          user_id: parseInt(userId)
        })
      }
      
    } catch (error) {
      console.error('❌ Access check query failed:', error)
      return NextResponse.json({ error: 'Database error during access check' }, { status: 500 })
    }

    if (accessCheck.length === 0) {
      console.log(`❌ Gig ${gigId} not found in database`)
      
      // Let's also check if there are applications for this gig
      try {
        const appCheck = await sql`
          SELECT gig_id, usher_id, status FROM applications 
          WHERE gig_id = ${gigId} AND usher_id = ${parseInt(userId)}
        `
        console.log(`🔍 Application check for gig ${gigId}:`, appCheck)
      } catch (e) {
        console.log(`❌ Application check failed:`, e)
      }
      
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    const access = accessCheck[0]
    
    if (access.access_type === 'none') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch messages for the gig
    const messages = await sql`
      SELECT 
        gm.id,
        gm.message,
        gm.message_type,
        gm.is_announcement,
        gm.created_at,
        u.id as sender_id,
        u.name as sender_name,
        u.role as sender_role,
        CASE 
          WHEN u.role = 'brand' THEN b.company_name
          ELSE NULL
        END as company_name
      FROM gig_messages gm
      JOIN users u ON gm.sender_id = u.id
      LEFT JOIN brands b ON u.id = b.user_id AND u.role = 'brand'
      WHERE gm.gig_id = ${gigId}
      ORDER BY gm.created_at ASC
      LIMIT ${limit}
    `

    return NextResponse.json({
      success: true,
      gig: {
        id: gigId,
        title: access.gig_title,
        userAccess: access.access_type
      },
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        messageType: msg.message_type,
        isAnnouncement: msg.is_announcement,
        createdAt: msg.created_at,
        sender: {
          id: msg.sender_id,
          name: msg.sender_name,
          role: msg.sender_role,
          companyName: msg.company_name
        }
      }))
    })

  } catch (error) {
    console.error('Get gig messages error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST - Send a new message to the gig
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gigId = parseInt(params.id)
    
    if (isNaN(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    const { message, messageType, isAnnouncement, senderId } = await request.json()

    if (!message || !senderId) {
      return NextResponse.json({ 
        error: 'Message and sender ID are required' 
      }, { status: 400 })
    }

    // Verify user has access to send messages to this gig
    console.log(`🔍 POST Chat access check: gigId=${gigId}, senderId=${senderId}`)
    
    let accessCheck
    try {
      accessCheck = await sql`
        SELECT 
          CASE 
            WHEN g.brand_id = ${parseInt(senderId)} THEN 'brand'
            WHEN EXISTS (
              SELECT 1 FROM applications a 
              WHERE a.gig_id = ${gigId} 
              AND a.usher_id = ${parseInt(senderId)} 
              AND a.status = 'approved'
            ) THEN 'usher'
            ELSE 'none'
          END as access_type,
          g.title as gig_title,
          u.name as sender_name,
          u.role as sender_role,
          g.brand_id,
          g.id as gig_exists
        FROM gigs g
        JOIN users u ON u.id = ${parseInt(senderId)}
        WHERE g.id = ${gigId}
      `
      
      console.log(`✅ POST Access check query successful: ${accessCheck.length} results`)
      if (accessCheck.length > 0) {
        console.log(`📊 POST Access result:`, {
          access_type: accessCheck[0].access_type,
          gig_title: accessCheck[0].gig_title,
          sender_name: accessCheck[0].sender_name,
          brand_id: accessCheck[0].brand_id,
          sender_id: parseInt(senderId)
        })
      }
      
    } catch (error) {
      console.error('❌ POST access check query failed:', error)
      return NextResponse.json({ error: 'Database error during access verification' }, { status: 500 })
    }

    if (accessCheck.length === 0) {
      console.log(`❌ POST: Gig ${gigId} or user ${senderId} not found`)
      return NextResponse.json({ error: 'Gig or user not found' }, { status: 404 })
    }

    const access = accessCheck[0]
    if (access.access_type === 'none') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only brands can send announcements
    const effectiveIsAnnouncement = (access.access_type === 'brand' && isAnnouncement) || false
    const effectiveMessageType = effectiveIsAnnouncement ? 'announcement' : (messageType || 'message')

    // Insert the message
    const result = await sql`
      INSERT INTO gig_messages (gig_id, sender_id, message, message_type, is_announcement)
      VALUES (${gigId}, ${parseInt(senderId)}, ${message}, ${effectiveMessageType}, ${effectiveIsAnnouncement})
      RETURNING id, created_at
    `

    const newMessage = result[0]

    // Get all users who should receive notifications (approved ushers + brand)
    const recipients = await sql`
      SELECT DISTINCT u.id, u.name, u.phone, u.role
      FROM users u
      WHERE u.id = (SELECT brand_id FROM gigs WHERE id = ${gigId})
      OR u.id IN (
        SELECT usher_id FROM applications 
        WHERE gig_id = ${gigId} AND status = 'approved'
      )
      AND u.id != ${parseInt(senderId)}
      AND u.is_active = true
    `

    // Create in-app notifications for recipients (no WhatsApp)
    if (recipients.length > 0) {
      // Get gig title for better notification context
      const gigResult = await sql`
        SELECT title FROM gigs WHERE id = ${gigId}
      `
      const gigTitle = gigResult[0]?.title || 'Gig'

      for (const recipient of recipients) {
        const notificationTitle = effectiveIsAnnouncement 
          ? `📢 Announcement: ${gigTitle}`
          : `💬 New Message: ${gigTitle}`
        
        const notificationMessage = effectiveIsAnnouncement
          ? `Announcement: ${message}`
          : `${access.sender_name}: ${message}`

        // Store notification in database only (no WhatsApp sending)
        await sql`
          INSERT INTO notifications (user_id, title, message, type, reference_id, status)
          VALUES (
            ${recipient.id}, 
            ${notificationTitle}, 
            ${notificationMessage}, 
            ${effectiveIsAnnouncement ? 'gig_announcement' : 'gig_message'}, 
            ${gigId.toString()}, 
            'delivered'
          )
        `
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        message: message,
        messageType: effectiveMessageType,
        isAnnouncement: effectiveIsAnnouncement,
        createdAt: newMessage.created_at,
        sender: {
          id: parseInt(senderId),
          name: access.sender_name,
          role: access.sender_role
        }
      },
      recipientsNotified: recipients.length
    })

  } catch (error) {
    console.error('Send gig message error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send message', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
