-- Clear verification codes for your specific phone number
-- Replace with your actual phone number in different formats

DELETE FROM verification_codes 
WHERE phone IN (
  '+201010612370',    -- International format
  '+2201010612370',   -- With extra 2
  '201010612370',     -- Without +
  '01010612370'       -- Local format
);

-- Or clear all verification codes (for testing)
DELETE FROM verification_codes;

-- Verify they're cleared
SELECT COUNT(*) as remaining_codes FROM verification_codes;

-- Show success message
SELECT 'Verification codes cleared - you can now test SMS again!' as status;
