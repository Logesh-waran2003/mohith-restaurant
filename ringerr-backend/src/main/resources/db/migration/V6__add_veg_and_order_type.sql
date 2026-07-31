-- Add veg flag to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS veg BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing items: anything with 'chicken','beef','fish','mutton','prawn','egg' in name = non-veg
UPDATE menu_items SET veg = FALSE
WHERE lower(name) SIMILAR TO '%(chicken|beef|fish|mutton|prawn|egg|lamb|pork|meat|bacon|tuna|salmon)%';

-- Add order_type to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'DINE_IN';
