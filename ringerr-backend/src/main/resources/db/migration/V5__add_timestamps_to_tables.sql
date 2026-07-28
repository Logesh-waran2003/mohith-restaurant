ALTER TABLE restaurant_tables
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE restaurant_tables SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;
