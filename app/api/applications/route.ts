import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { notificationService, NotificationHelpers } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const { gigId, usherId } = await request.json()

    console.log("Creating application:", { gigId, usherId })

    if (!gigId || !usherId) {
      return NextResponse.json({ error: "Missing gigId or usherId" }, { status: 400 })
    }

    // Check if there's an active application (not rejected)
    const existing = await sql`
      SELECT id, status FROM applications 
      WHERE gig_id = ${gigId} AND usher_id = ${usherId} AND status != 'rejected'
    `

    if (existing.length > 0) {
      const app = existing[0]
      if (app.status === "pending") {
        return NextResponse.json({ error: "Application already pending review" }, { status: 400 })
      } else if (app.status === "approved") {
        return NextResponse.json({ error: "Application already approved" }, { status: 400 })
      }
    }

    // Check if the new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name = 'start_date'
    `

    const hasNewColumns = columnsCheck.length > 0

    // Get the gig details to check dates
    const gigResult = await sql`
      SELECT g.id, g.brand_id, g.title, g.total_ushers_needed, g.start_datetime,
             (SELECT COUNT(*) FROM applications a WHERE a.gig_id = g.id AND a.status = 'approved') as approved_count
      FROM gigs g
      WHERE g.id = ${gigId} AND g.status = 'active'
    `

    if (gigResult.length === 0) {
      return NextResponse.json({ error: "Gig not found or not active" }, { status: 404 })
    }

    const gig = gigResult[0]

    // Check if gig is full
    if (Number(gig.approved_count) >= Number(gig.total_ushers_needed)) {
      return NextResponse.json({ error: "Gig is already full" }, { status: 400 })
    }

    // Only check for date conflicts with APPROVED applications (not pending)
    if (hasNewColumns) {
      // Get start_date and end_date for this gig
      const gigDatesResult = await sql`
        SELECT start_date, end_date FROM gigs WHERE id = ${gigId}
      `

      if (gigDatesResult.length > 0 && gigDatesResult[0].start_date && gigDatesResult[0].end_date) {
        const gigDates = gigDatesResult[0]

        const conflictingApplications = await sql`
          SELECT a.id, g.title, g.start_date, g.end_date
          FROM applications a
          JOIN gigs g ON a.gig_id = g.id
          WHERE a.usher_id = ${usherId} 
          AND a.status IN ('pending', 'approved')
          AND g.status = 'active'
          AND g.start_date IS NOT NULL
          AND g.end_date IS NOT NULL
          AND (
            -- Check for date range overlap
            (g.start_date <= ${gigDates.end_date} AND g.end_date >= ${gigDates.start_date})
            OR
            -- Handle single day gigs (where start_date = end_date)
            (g.start_date = g.end_date AND g.start_date BETWEEN ${gigDates.start_date} AND ${gigDates.end_date})
            OR
            (${gigDates.start_date} = ${gigDates.end_date} AND ${gigDates.start_date} BETWEEN g.start_date AND g.end_date)
          )
        `

        if (conflictingApplications.length > 0) {
          const conflictingGig = conflictingApplications[0]
          return NextResponse.json(
            {
              error: `You already have another application (pending or approved) for "${conflictingGig.title}" that overlaps with this gig's dates.`,
              conflictingGig: conflictingGig.title,
            },
            { status: 400 },
          )
        }
      }
    }

    // Check if there's a rejected application - if so, update it instead of creating new
    const rejectedApp = await sql`
      SELECT id FROM applications 
      WHERE gig_id = ${gigId} AND usher_id = ${usherId} AND status = 'rejected'
    `

    let result
    if (rejectedApp.length > 0) {
      // Update the rejected application to pending
      result = await sql`
        UPDATE applications 
        SET status = LOWER('pending'), applied_at = NOW(), reviewed_at = NULL
        WHERE id = ${rejectedApp[0].id}
        RETURNING *
      `
      console.log("Updated rejected application to pending:", result[0])
    } else {
      // Create new application
      result = await sql`
        INSERT INTO applications (gig_id, usher_id, status)
        VALUES (${gigId}, ${usherId}, LOWER('pending'))
        RETURNING *
      `
      console.log("Created new application:", result[0])
    }

    // Get usher name for notification
    const usherResult = await sql`
      SELECT name FROM users WHERE id = ${usherId}
    `
    const usherName = usherResult[0]?.name || 'An usher'

    // Send enhanced notification to brand
    await notificationService.sendNotification(
      NotificationHelpers.newApplication(gig.brand_id, gig.title, usherName)
    )

    return NextResponse.json({
      success: true,
      application: result[0],
      message: "Application submitted successfully",
    })
  } catch (error) {
    console.error("Application error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { applicationId, status } = await request.json()

    const result = await sql`
      UPDATE applications 
      SET status = LOWER(${status}), reviewed_at = NOW()
      WHERE id = ${applicationId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Get application and gig details
    const appData = await sql`
      SELECT a.usher_id, a.gig_id, g.title, g.total_ushers_needed,
             (SELECT COUNT(*) FROM applications WHERE gig_id = a.gig_id AND status = 'approved') as approved_count
      FROM applications a
      JOIN gigs g ON a.gig_id = g.id
      WHERE a.id = ${applicationId}
    `

    if (appData.length > 0) {
      const app = appData[0]
      
      // Send notification to the usher whose application was updated
      await notificationService.sendNotification(
        NotificationHelpers.applicationStatusChange(app.usher_id, app.title, status)
      )

      // If this application was approved, check if gig is now full
      if (status.toLowerCase() === 'approved') {
        console.log(`📊 Gig ${app.gig_id} status: ${app.approved_count}/${app.total_ushers_needed} approved`)
        
        // If gig has reached capacity, auto-reject remaining pending applications
        if (app.approved_count >= app.total_ushers_needed) {
          console.log(`🎯 Gig ${app.gig_id} is now full! Auto-rejecting remaining pending applications...`)
          
          // Get all pending applications for this gig
          const pendingApps = await sql`
            SELECT id, usher_id FROM applications 
            WHERE gig_id = ${app.gig_id} AND status = 'pending'
          `
          
          if (pendingApps.length > 0) {
            // Auto-reject all pending applications
            await sql`
              UPDATE applications 
              SET status = 'rejected', reviewed_at = NOW()
              WHERE gig_id = ${app.gig_id} AND status = 'pending'
            `
            
            console.log(`✅ Auto-rejected ${pendingApps.length} pending applications for full gig`)
            
            // Send notifications to all auto-rejected ushers
            for (const pendingApp of pendingApps) {
              await notificationService.sendNotification(
                NotificationHelpers.applicationStatusChange(pendingApp.usher_id, app.title, 'rejected')
              )
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      application: result[0],
    })
  } catch (error) {
    console.error("Application update error:", error)
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 })
  }
}
