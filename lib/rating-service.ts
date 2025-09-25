import { sql } from '@/lib/db'
import { notificationService, NotificationHelpers } from '@/lib/notification-service'

export interface RatingData {
  gigId: number
  usherId: number
  brandRating: number // 1-5 stars from brand
  attendanceDays: number
  totalGigDays: number
  ratingNotes?: string
}

export interface RatingCalculation {
  attendanceRating: number // 0-2 stars based on attendance
  brandRatingStars: number // 0-3 stars based on brand rating
  finalRating: number // 0-5 stars total
}

export interface UsherRatingStats {
  overallRating: number
  attendanceRating: number
  brandRating: number
  totalRatings: number
  completedGigs: number
  attendancePercentage: number
  ratingBreakdown: {
    fiveStars: number
    fourStars: number
    threeStars: number
    twoStars: number
    oneStar: number
  }
}

class RatingService {
  
  /**
   * Calculate dynamic rating based on attendance and brand rating
   */
  calculateRating(attendanceDays: number, totalGigDays: number, brandRating: number): RatingCalculation {
    // Validate inputs
    if (attendanceDays < 0 || totalGigDays <= 0 || brandRating < 1 || brandRating > 5) {
      throw new Error('Invalid rating parameters')
    }
    
    if (attendanceDays > totalGigDays) {
      attendanceDays = totalGigDays // Cap attendance at total days
    }
    
    // Calculate attendance stars (max 2 stars)
    const attendanceRating = (attendanceDays / totalGigDays) * 2.0
    
    // Calculate brand rating stars (max 3 stars)
    const brandRatingStars = (brandRating / 5.0) * 3.0
    
    // Calculate final rating
    let finalRating = attendanceRating + brandRatingStars
    
    // Round to 2 decimal places and ensure it's between 0 and 5
    finalRating = Math.round(finalRating * 100) / 100
    finalRating = Math.max(0, Math.min(5, finalRating))
    
    return {
      attendanceRating: Math.round(attendanceRating * 100) / 100,
      brandRatingStars: Math.round(brandRatingStars * 100) / 100,
      finalRating
    }
  }
  
  /**
   * Submit a rating for an usher after gig completion
   */
  async submitRating(data: RatingData): Promise<{ success: boolean; message: string; rating?: RatingCalculation }> {
    try {
      // Validate that the gig exists and is completed
      const gigResult = await sql`
        SELECT g.id, g.title, g.brand_id, g.status, u.name as usher_name
        FROM gigs g
        JOIN users u ON u.id = ${data.usherId}
        WHERE g.id = ${data.gigId}
      `
      
      if (gigResult.length === 0) {
        return { success: false, message: 'Gig not found' }
      }
      
      const gig = gigResult[0]
      
      // Check if usher was approved for this gig
      const applicationResult = await sql`
        SELECT status FROM applications 
        WHERE gig_id = ${data.gigId} AND usher_id = ${data.usherId}
      `
      
      if (applicationResult.length === 0 || applicationResult[0].status !== 'approved') {
        return { success: false, message: 'Usher was not approved for this gig' }
      }
      
      // Calculate the rating
      const ratingCalculation = this.calculateRating(
        data.attendanceDays,
        data.totalGigDays,
        data.brandRating
      )
      
      // Insert or update the rating
      await sql`
        INSERT INTO gig_ratings (
          gig_id, usher_id, brand_rating, attendance_days, total_gig_days,
          attendance_rating, brand_rating_stars, final_rating, rating_notes
        )
        VALUES (
          ${data.gigId}, ${data.usherId}, ${data.brandRating}, ${data.attendanceDays}, ${data.totalGigDays},
          ${ratingCalculation.attendanceRating}, ${ratingCalculation.brandRatingStars}, 
          ${ratingCalculation.finalRating}, ${data.ratingNotes || null}
        )
        ON CONFLICT (gig_id, usher_id) DO UPDATE SET
          brand_rating = EXCLUDED.brand_rating,
          attendance_days = EXCLUDED.attendance_days,
          total_gig_days = EXCLUDED.total_gig_days,
          attendance_rating = EXCLUDED.attendance_rating,
          brand_rating_stars = EXCLUDED.brand_rating_stars,
          final_rating = EXCLUDED.final_rating,
          rating_notes = EXCLUDED.rating_notes,
          updated_at = NOW()
      `
      
      // The trigger will automatically update the usher's overall rating
      
      // Send notification to usher
      await notificationService.sendNotification(
        NotificationHelpers.newRating(data.usherId, ratingCalculation.finalRating, gig.title)
      )
      
      console.log(`✅ Rating submitted for usher ${data.usherId} on gig ${data.gigId}: ${ratingCalculation.finalRating} stars`)
      
      return {
        success: true,
        message: 'Rating submitted successfully',
        rating: ratingCalculation
      }
      
    } catch (error) {
      console.error('❌ Error submitting rating:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Get detailed rating statistics for an usher
   */
  async getUsherRatingStats(usherId: number): Promise<UsherRatingStats | null> {
    try {
      // Get overall stats from ushers table
      const usherResult = await sql`
        SELECT rating, attendance_rating, brand_rating, total_gigs_completed
        FROM ushers
        WHERE user_id = ${usherId}
      `
      
      if (usherResult.length === 0) {
        return null
      }
      
      const usher = usherResult[0]
      
      // Get detailed rating breakdown
      const ratingsResult = await sql`
        SELECT 
          COUNT(*) as total_ratings,
          AVG(final_rating) as avg_rating,
          AVG(attendance_rating) as avg_attendance,
          AVG(brand_rating_stars) as avg_brand_rating,
          AVG(attendance_days::DECIMAL / total_gig_days::DECIMAL * 100) as attendance_percentage,
          COUNT(CASE WHEN final_rating >= 4.5 THEN 1 END) as five_stars,
          COUNT(CASE WHEN final_rating >= 3.5 AND final_rating < 4.5 THEN 1 END) as four_stars,
          COUNT(CASE WHEN final_rating >= 2.5 AND final_rating < 3.5 THEN 1 END) as three_stars,
          COUNT(CASE WHEN final_rating >= 1.5 AND final_rating < 2.5 THEN 1 END) as two_stars,
          COUNT(CASE WHEN final_rating < 1.5 THEN 1 END) as one_star
        FROM gig_ratings
        WHERE usher_id = ${usherId}
      `
      
      const stats = ratingsResult[0]
      
      return {
        overallRating: parseFloat(usher.rating) || 0,
        attendanceRating: parseFloat(usher.attendance_rating) || 0,
        brandRating: parseFloat(usher.brand_rating) || 0,
        totalRatings: parseInt(stats.total_ratings) || 0,
        completedGigs: parseInt(usher.total_gigs_completed) || 0,
        attendancePercentage: parseFloat(stats.attendance_percentage) || 0,
        ratingBreakdown: {
          fiveStars: parseInt(stats.five_stars) || 0,
          fourStars: parseInt(stats.four_stars) || 0,
          threeStars: parseInt(stats.three_stars) || 0,
          twoStars: parseInt(stats.two_stars) || 0,
          oneStar: parseInt(stats.one_star) || 0
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting usher rating stats:', error)
      return null
    }
  }
  
  /**
   * Get rating history for an usher
   */
  async getUsherRatingHistory(usherId: number, limit: number = 10): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          gr.*, 
          g.title as gig_title,
          g.datetime as gig_date,
          g.location as gig_location,
          b.company_name as brand_company
        FROM gig_ratings gr
        JOIN gigs g ON g.id = gr.gig_id
        JOIN users bu ON bu.id = g.brand_id
        JOIN brands b ON b.user_id = bu.id
        WHERE gr.usher_id = ${usherId}
        ORDER BY gr.created_at DESC
        LIMIT ${limit}
      `
      
      return result.map(rating => ({
        id: rating.id,
        gigTitle: rating.gig_title,
        gigDate: rating.gig_date,
        gigLocation: rating.gig_location,
        brandCompany: rating.brand_company,
        brandRating: rating.brand_rating,
        attendanceDays: rating.attendance_days,
        totalGigDays: rating.total_gig_days,
        attendanceRating: parseFloat(rating.attendance_rating),
        brandRatingStars: parseFloat(rating.brand_rating_stars),
        finalRating: parseFloat(rating.final_rating),
        ratingNotes: rating.rating_notes,
        createdAt: rating.created_at
      }))
      
    } catch (error) {
      console.error('❌ Error getting usher rating history:', error)
      return []
    }
  }
  
  /**
   * Get rating for a specific gig and usher
   */
  async getGigRating(gigId: number, usherId: number): Promise<any | null> {
    try {
      const result = await sql`
        SELECT * FROM gig_ratings
        WHERE gig_id = ${gigId} AND usher_id = ${usherId}
      `
      
      if (result.length === 0) {
        return null
      }
      
      const rating = result[0]
      return {
        id: rating.id,
        gigId: rating.gig_id,
        usherId: rating.usher_id,
        brandRating: rating.brand_rating,
        attendanceDays: rating.attendance_days,
        totalGigDays: rating.total_gig_days,
        attendanceRating: parseFloat(rating.attendance_rating),
        brandRatingStars: parseFloat(rating.brand_rating_stars),
        finalRating: parseFloat(rating.final_rating),
        ratingNotes: rating.rating_notes,
        createdAt: rating.created_at,
        updatedAt: rating.updated_at
      }
      
    } catch (error) {
      console.error('❌ Error getting gig rating:', error)
      return null
    }
  }
  
  /**
   * Update attendance for a gig (called when usher checks in/out)
   */
  async updateAttendance(gigId: number, usherId: number, attendanceDays: number, totalGigDays: number): Promise<boolean> {
    try {
      // Check if rating already exists
      const existingRating = await this.getGigRating(gigId, usherId)
      
      if (existingRating) {
        // Update existing rating with new attendance
        const newCalculation = this.calculateRating(
          attendanceDays,
          totalGigDays,
          existingRating.brandRating || 5 // Default to 5 if no brand rating yet
        )
        
        await sql`
          UPDATE gig_ratings SET
            attendance_days = ${attendanceDays},
            total_gig_days = ${totalGigDays},
            attendance_rating = ${newCalculation.attendanceRating},
            final_rating = ${newCalculation.finalRating},
            updated_at = NOW()
          WHERE gig_id = ${gigId} AND usher_id = ${usherId}
        `
      } else {
        // Create new rating with attendance only (brand rating will be added later)
        const calculation = this.calculateRating(attendanceDays, totalGigDays, 5) // Default brand rating
        
        await sql`
          INSERT INTO gig_ratings (
            gig_id, usher_id, brand_rating, attendance_days, total_gig_days,
            attendance_rating, brand_rating_stars, final_rating
          )
          VALUES (
            ${gigId}, ${usherId}, 5, ${attendanceDays}, ${totalGigDays},
            ${calculation.attendanceRating}, ${calculation.brandRatingStars}, ${calculation.finalRating}
          )
        `
      }
      
      return true
    } catch (error) {
      console.error('❌ Error updating attendance:', error)
      return false
    }
  }
  
  /**
   * Get top-rated ushers
   */
  async getTopRatedUshers(limit: number = 10): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          u.id,
          u.name,
          ush.rating,
          ush.attendance_rating,
          ush.brand_rating,
          ush.total_gigs_completed,
          ush.profile_photo_url,
          COUNT(gr.id) as total_ratings
        FROM users u
        JOIN ushers ush ON ush.user_id = u.id
        LEFT JOIN gig_ratings gr ON gr.usher_id = u.id
        WHERE u.role = 'usher' AND u.is_active = true
        GROUP BY u.id, u.name, ush.rating, ush.attendance_rating, ush.brand_rating, ush.total_gigs_completed, ush.profile_photo_url
        HAVING COUNT(gr.id) > 0
        ORDER BY ush.rating DESC, ush.total_gigs_completed DESC
        LIMIT ${limit}
      `
      
      return result.map(usher => ({
        id: usher.id,
        name: usher.name,
        rating: parseFloat(usher.rating),
        attendanceRating: parseFloat(usher.attendance_rating),
        brandRating: parseFloat(usher.brand_rating),
        totalGigsCompleted: usher.total_gigs_completed,
        profilePhotoUrl: usher.profile_photo_url,
        totalRatings: parseInt(usher.total_ratings)
      }))
      
    } catch (error) {
      console.error('❌ Error getting top-rated ushers:', error)
      return []
    }
  }
}

export const ratingService = new RatingService()
