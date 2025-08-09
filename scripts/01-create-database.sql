-- Aura Platform Database Schema for Neon PostgreSQL
-- Egypt North Coast Event Staffing Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (All roles)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,  -- Auth identifier (Egyptian format)
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(10) CHECK (role IN ('usher', 'brand', 'admin')) NOT NULL,
  language VARCHAR(2) DEFAULT 'ar',   -- 'ar' (Arabic) or 'en' (English)
  password_hash VARCHAR(255),         -- Hashed password for authentication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Usher Profiles
CREATE TABLE IF NOT EXISTS ushers (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT[],                       -- e.g., {'luxury events', 'bartending', 'hospitality'}
  id_verified BOOLEAN DEFAULT FALSE,   -- Admin-managed verification
  id_document_url TEXT,                -- Document storage URL
  vcash_number VARCHAR(20),            -- Vodafone Cash number
  experience_years INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,   -- Average rating from brands
  total_gigs_completed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Profiles
CREATE TABLE IF NOT EXISTS brands (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,  -- Pre-funded wallet in EGP
  tax_id VARCHAR(50),                          -- Egyptian tax registration
  contact_person VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gigs/Events
CREATE TABLE IF NOT EXISTS gigs (
  id SERIAL PRIMARY KEY,
  brand_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location TEXT NOT NULL,              -- North Coast locations
  datetime TIMESTAMPTZ NOT NULL,
  duration_hours INT NOT NULL,         -- Event duration
  pay_rate DECIMAL(8,2) NOT NULL,      -- EGP per hour
  total_ushers_needed INT NOT NULL,
  skills_required TEXT[],              -- Required skills
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  qr_code_token UUID DEFAULT uuid_generate_v4(), -- For check-in
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications (Ushers applying to gigs)
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  usher_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(gig_id, usher_id)
);

-- Shifts & Attendance
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  gig_id INT REFERENCES gigs(id) ON DELETE CASCADE,
  usher_id INT REFERENCES users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ,           -- QR scan timestamp
  check_out_time TIMESTAMPTZ,
  hours_worked DECIMAL(4,2),           -- Calculated hours
  payout_amount DECIMAL(8,2),          -- Amount to be paid
  payout_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'payment'
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_id VARCHAR(100),           -- Paymob transaction ID
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,           -- 'gig_alert', 'payment', 'verification'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_gigs_datetime ON gigs(datetime);
CREATE INDEX IF NOT EXISTS idx_gigs_location ON gigs(location);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_shifts_payout_status ON shifts(payout_status);
