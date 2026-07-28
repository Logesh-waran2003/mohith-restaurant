-- Phase 2: Menu, Tables, Staff, Orders schema

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    image_url VARCHAR(500),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurant_tables (
    id BIGSERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    location VARCHAR(100)
);

CREATE TABLE staff (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    hire_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    table_id BIGINT NOT NULL REFERENCES restaurant_tables(id),
    staff_id BIGINT REFERENCES staff(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    notes TEXT
);

-- Seed categories
INSERT INTO categories (name, description) VALUES
  ('Starters', 'Appetizers and starters'),
  ('Mains', 'Main course dishes'),
  ('Desserts', 'Sweet endings'),
  ('Beverages', 'Drinks and refreshments');

-- Seed menu items
INSERT INTO menu_items (name, description, price, category_id, available) VALUES
  ('Spring Rolls', 'Crispy vegetable spring rolls', 5.99, 1, true),
  ('Garlic Bread', 'Toasted with garlic butter', 3.99, 1, true),
  ('Grilled Chicken', 'Herb-marinated grilled chicken breast', 14.99, 2, true),
  ('Beef Burger', 'Angus beef with lettuce, tomato, cheese', 12.99, 2, true),
  ('Pasta Carbonara', 'Creamy pasta with bacon and egg', 11.99, 2, true),
  ('Chocolate Lava Cake', 'Warm cake with molten chocolate center', 6.99, 3, true),
  ('Ice Cream Sundae', 'Three scoops with toppings', 4.99, 3, true),
  ('Lemonade', 'Fresh-squeezed lemonade', 2.99, 4, true),
  ('Coffee', 'Freshly brewed espresso', 2.49, 4, true);

-- Seed restaurant tables
INSERT INTO restaurant_tables (table_number, capacity, status, location) VALUES
  (1, 2, 'AVAILABLE', 'Window'),
  (2, 2, 'AVAILABLE', 'Window'),
  (3, 4, 'AVAILABLE', 'Center'),
  (4, 4, 'AVAILABLE', 'Center'),
  (5, 4, 'AVAILABLE', 'Center'),
  (6, 6, 'AVAILABLE', 'Patio'),
  (7, 6, 'AVAILABLE', 'Patio'),
  (8, 8, 'AVAILABLE', 'Private Room');
