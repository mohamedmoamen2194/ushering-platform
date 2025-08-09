-- Seed data for Aura Platform
-- Sample data for testing

-- Insert admin user
INSERT INTO users (phone, name, email, role, language) VALUES
('+201000000001', 'Admin User', 'admin@aura-platform.com', 'admin', 'ar')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample brand
INSERT INTO users (phone, name, email, role, language) VALUES
('+201000000002', 'Ahmed Hassan', 'contact@luxuryevents.eg', 'brand', 'ar')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO brands (user_id, company_name, industry, wallet_balance, contact_person) VALUES
(2, 'Luxury Events Co', 'Event Management', 5000.00, 'Ahmed Hassan')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample ushers
INSERT INTO users (phone, name, email, role, language) VALUES
('+201000000003', 'محمد علي', 'mohamed.ali@email.com', 'usher', 'ar'),
('+201000000004', 'فاطمة أحمد', 'fatma.ahmed@email.com', 'usher', 'ar'),
('+201000000005', 'Omar Khaled', 'omar.khaled@email.com', 'usher', 'en')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO ushers (user_id, skills, id_verified, vcash_number, experience_years) VALUES
(3, ARRAY['luxury-events', 'hospitality'], TRUE, '01000000003', 2),
(4, ARRAY['bartending', 'customer-service'], TRUE, '01000000004', 1),
(5, ARRAY['event-coordination', 'multilingual'], FALSE, '01000000005', 3)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample gigs
INSERT INTO gigs (brand_id, title, description, location, datetime, duration_hours, pay_rate, total_ushers_needed, skills_required) VALUES
(2, 'Luxury Beach Resort Opening', 'Grand opening event for new resort in North Coast', 'Hacienda Bay, North Coast', '2024-07-15 18:00:00+02', 6, 150.00, 10, ARRAY['luxury-events', 'hospitality']),
(2, 'Summer Music Festival', 'Three-day music festival requiring event staff', 'Marina, North Coast', '2024-07-20 16:00:00+02', 8, 120.00, 15, ARRAY['crowd-control', 'customer-service'])
ON CONFLICT DO NOTHING;

-- Insert sample applications
INSERT INTO applications (gig_id, usher_id, status) VALUES
(1, 3, 'approved'),
(1, 4, 'pending'),
(2, 3, 'approved'),
(2, 5, 'pending')
ON CONFLICT (gig_id, usher_id) DO NOTHING;

-- Insert sample shifts
INSERT INTO shifts (gig_id, usher_id, check_in_time, hours_worked, payout_amount, payout_status) VALUES
(1, 3, '2024-07-15 18:00:00+02', 6.0, 900.00, 'completed')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(3, 'Application Approved', 'Your application for Luxury Beach Resort Opening has been approved!', 'gig_alert'),
(4, 'New Gig Available', 'A new gig matching your skills is available in Marina', 'gig_alert'),
(2, 'New Application', 'You have a new application for Summer Music Festival', 'application')
ON CONFLICT DO NOTHING;
