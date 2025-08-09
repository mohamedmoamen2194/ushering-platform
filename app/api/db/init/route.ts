import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Initializing database...")

    // Create all tables
    await sql`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Users table (All roles)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(10) CHECK (role IN ('usher', 'brand', 'admin')) NOT NULL,
        language VARCHAR(2) DEFAULT 'ar',
        password_hash VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      );

      -- Usher Profiles
      CREATE TABLE IF NOT EXISTS ushers (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        skills TEXT[],
        id_verified BOOLEAN DEFAULT FALSE,
        id_document_url TEXT,
        vcash_number VARCHAR(20),
        experience_years INT DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_gigs_completed INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Brand Profiles
      CREATE TABLE IF NOT EXISTS brands (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        wallet_balance DECIMAL(10,2) DEFAULT 0.00,
        tax_id VARCHAR(50),
        contact_person VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Gigs/Events
      CREATE TABLE IF NOT EXISTS gigs (
        id SERIAL PRIMARY KEY,
        brand_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        datetime TIMESTAMPTZ NOT NULL,
        duration_hours INT NOT NULL,
        pay_rate DECIMAL(8,2) NOT NULL,
        total_ushers_needed INT NOT NULL,
        skills_required TEXT[],
        status VARCHAR(20) DEFAULT 'active',
        qr_code_token UUID DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Applications
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
        usher_id INT REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ,
        UNIQUE(gig_id, usher_id)
      );

      -- Shifts & Attendance
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
        usher_id INT REFERENCES users(id) ON DELETE CASCADE,
        check_in_time TIMESTAMPTZ,
        check_out_time TIMESTAMPTZ,
        hours_worked DECIMAL(4,2),
        payout_amount DECIMAL(8,2),
        payout_status VARCHAR(20) DEFAULT 'pending',
        payout_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Wallet Transactions
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        balance_after DECIMAL(10,2) NOT NULL,
        reference_id VARCHAR(100),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_gigs_datetime ON gigs(datetime);
      CREATE INDEX IF NOT EXISTS idx_gigs_location ON gigs(location);
      CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_shifts_payout_status ON shifts(payout_status);
    `

    console.log("Database tables created successfully")

    // Insert sample data
    await sql`
      -- Insert admin user
      INSERT INTO users (phone, name, email, role, language) VALUES
      ('+201000000001', 'Admin User', 'admin@aura-platform.com', 'admin', 'ar')
      ON CONFLICT (phone) DO NOTHING;

      -- Insert sample brand
      INSERT INTO users (phone, name, email, role, language) VALUES
      ('+201000000002', 'Ahmed Hassan', 'contact@luxuryevents.eg', 'brand', 'ar')
      ON CONFLICT (phone) DO NOTHING;
    `

    // Insert brand profile
    await sql`
      INSERT INTO brands (user_id, company_name, industry, wallet_balance, contact_person) 
      SELECT 2, 'Luxury Events Co', 'Event Management', 5000.00, 'Ahmed Hassan'
      WHERE EXISTS (SELECT 1 FROM users WHERE id = 2)
      ON CONFLICT (user_id) DO NOTHING;
    `

    // Insert sample ushers
    await sql`
      INSERT INTO users (phone, name, email, role, language) VALUES
      ('+201000000003', 'محمد علي', 'mohamed.ali@email.com', 'usher', 'ar'),
      ('+201000000004', 'فاطمة أحمد', 'fatma.ahmed@email.com', 'usher', 'ar'),
      ('+201000000005', 'Omar Khaled', 'omar.khaled@email.com', 'usher', 'en')
      ON CONFLICT (phone) DO NOTHING;
    `

    // Insert usher profiles
    await sql`
      INSERT INTO ushers (user_id, skills, id_verified, vcash_number, experience_years) 
      SELECT 3, ARRAY['luxury-events', 'hospitality'], TRUE, '01000000003', 2
      WHERE EXISTS (SELECT 1 FROM users WHERE id = 3)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO ushers (user_id, skills, id_verified, vcash_number, experience_years) 
      SELECT 4, ARRAY['bartending', 'customer-service'], TRUE, '01000000004', 1
      WHERE EXISTS (SELECT 1 FROM users WHERE id = 4)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO ushers (user_id, skills, id_verified, vcash_number, experience_years) 
      SELECT 5, ARRAY['event-coordination', 'multilingual'], FALSE, '01000000005', 3
      WHERE EXISTS (SELECT 1 FROM users WHERE id = 5)
      ON CONFLICT (user_id) DO NOTHING;
    `

    console.log("Sample data inserted successfully")

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully with sample data",
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
