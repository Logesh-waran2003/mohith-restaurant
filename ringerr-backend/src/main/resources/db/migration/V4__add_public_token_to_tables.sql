-- Add public token to tables for QR code ordering
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_public_token ON restaurant_tables(public_token);

-- Update existing tables to have tokens
UPDATE restaurant_tables SET public_token = gen_random_uuid() WHERE public_token IS NULL;
