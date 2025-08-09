import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔄 Setting up verified phone numbers table...')

    // Create the verified phone numbers table
    await sql`
      CREATE TABLE IF NOT EXISTS verified_phone_numbers (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        verified_by VARCHAR(50) DEFAULT 'admin',
        verified_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_verified_phone_numbers_phone ON verified_phone_numbers(phone)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_verified_phone_numbers_user_id ON verified_phone_numbers(user_id)
    `

    // Add some test numbers
    await sql`
      INSERT INTO verified_phone_numbers (phone, verified_by, notes) VALUES
        ('+201010612370', 'admin', 'Test number for development'),
        ('+201234567890', 'admin', 'Admin test number'),
        ('+1234567890', 'admin', 'US test number')
      ON CONFLICT (phone) DO NOTHING
    `

    // Create the function to check if phone is verified
    await sql`
      CREATE OR REPLACE FUNCTION is_phone_verified(phone_number VARCHAR)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM verified_phone_numbers 
          WHERE phone = phone_number AND is_active = TRUE
        );
      END;
      $$ LANGUAGE plpgsql
    `

    console.log('✅ Verified phone numbers setup completed!')

    return NextResponse.json({
      success: true,
      message: 'Verified phone numbers table created successfully',
      testNumbers: [
        '+201010612370',
        '+201234567890', 
        '+1234567890'
      ]
    })

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup verified phone numbers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 