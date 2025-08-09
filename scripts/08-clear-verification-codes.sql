-- Clear verification codes for testing
-- This will remove the rate limiting for your phone number

-- First, let's see what verification codes exist
SELECT 
  id,
  phone,
  code,
  created_at,
  expires_at,
  verified,
  attempts
FROM verification_codes 
ORDER BY created_at DESC;

-- Clear verification codes for your specific number
DELETE FROM verification_codes 
WHERE phone IN ('+201010612370', '+2201010612370', '201010612370');

-- Or clear all verification codes (for testing)
-- DELETE FROM verification_codes;

-- Verify they're cleared
SELECT COUNT(*) as remaining_codes FROM verification_codes;

-- Show success message
SELECT 'Verification codes cleared - you can now test SMS again!' as status;
