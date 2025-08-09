-- Add verified phone numbers table for Twilio integration
-- This allows admin to manage which numbers can receive SMS

CREATE TABLE IF NOT EXISTS verified_phone_numbers (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,  -- Phone number in international format (+20XXXXXXXXX)
  user_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Link to user if exists
  verified_by VARCHAR(50) DEFAULT 'admin',  -- 'admin', 'twilio_console', 'api'
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,  -- Admin notes about verification
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast phone number lookups
CREATE INDEX IF NOT EXISTS idx_verified_phone_numbers_phone ON verified_phone_numbers(phone);
CREATE INDEX IF NOT EXISTS idx_verified_phone_numbers_user_id ON verified_phone_numbers(user_id);

-- Insert some common verified numbers for testing
INSERT INTO verified_phone_numbers (phone, verified_by, notes) VALUES
  ('+201234567890', 'admin', 'Test number for development'),
  ('+201098765432', 'admin', 'Admin test number'),
  ('+1234567890', 'admin', 'US test number')
ON CONFLICT (phone) DO NOTHING;

-- Add a function to check if a phone number is verified
CREATE OR REPLACE FUNCTION is_phone_verified(phone_number VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM verified_phone_numbers 
    WHERE phone = phone_number AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql; 