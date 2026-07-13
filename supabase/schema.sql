-- ============================================
-- GAG2 Shop - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  image_url TEXT,
  unit TEXT NOT NULL DEFAULT '1',

  price_bank TEXT NOT NULL,
  price_card TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  hot BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('Seed', 'Gear', 'Pet')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  quantity INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank', 'card')),
  total_price TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contact info table
CREATE TABLE IF NOT EXISTS contact (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT NOT NULL,
  hours TEXT NOT NULL
);

-- Customers table (accounts)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deposits table (lệnh nạp tiền qua SePay)
CREATE TABLE IF NOT EXISTS deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,           -- nội dung chuyển khoản duy nhất (để match)
  amount BIGINT,                       -- số tiền dự kiến (có thể null nếu nạp tự do)
  received_amount BIGINT,              -- số tiền thực nhận từ webhook
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  sepay_tx_id TEXT,                    -- id giao dịch bên SePay (chống trùng)
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deposits_code ON deposits(code);
CREATE INDEX IF NOT EXISTS idx_deposits_customer ON deposits(customer_id);

-- ============================================
-- RPC: hoàn tất nạp tiền (atomic)
-- Match theo code, chống nạp trùng bằng sepay_tx_id + status.
-- Trả về customer_id nếu cộng thành công, NULL nếu không match / đã xử lý.
-- ============================================
CREATE OR REPLACE FUNCTION complete_deposit(
  p_code TEXT,
  p_amount BIGINT,
  p_tx_id TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dep deposits%ROWTYPE;
BEGIN
  -- Khoá dòng deposit đang pending khớp code
  SELECT * INTO v_dep
  FROM deposits
  WHERE code = p_code AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;  -- không có lệnh chờ khớp
  END IF;

  -- Chống xử lý trùng cùng 1 giao dịch SePay
  IF EXISTS (SELECT 1 FROM deposits WHERE sepay_tx_id = p_tx_id) THEN
    RETURN NULL;
  END IF;

  UPDATE deposits
  SET status = 'completed',
      received_amount = p_amount,
      sepay_tx_id = p_tx_id,
      completed_at = now()
  WHERE id = v_dep.id;

  UPDATE customers
  SET balance = balance + p_amount
  WHERE id = v_dep.customer_id;

  RETURN v_dep.customer_id;
END;
$$;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Public read access for products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Public read access for contact
DROP POLICY IF EXISTS "Contact is viewable by everyone" ON contact;
CREATE POLICY "Contact is viewable by everyone"
  ON contact FOR SELECT
  USING (true);

-- Public can create orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Public can read recent orders (for feed)
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON orders;
CREATE POLICY "Orders are viewable by everyone"
  ON orders FOR SELECT
  USING (true);

-- ============================================
-- SEED DATA - Initial products
-- ============================================
INSERT INTO products (name, emoji, unit, price_bank, price_card, stock, sold, hot, category, rarity)
SELECT * FROM (VALUES
  -- Seed / Hạt giống
  ('Dragon Breathe',     '🔥', '1', '9K',  '20K',  99, 412, true,  'Seed', 'legendary'),
  ('Moon Bloom',         '🪷', '1', '30K', '40K',  63, 198, false, 'Seed', 'epic'),
  ('Ghost Pepper',       '🌶️', '1', '50K', '70K',  28, 145, true,  'Seed', 'legendary'),
  ('Sun Bloom',          '🌻', '1', '25K', '35K',  71, 168, false, 'Seed', 'epic'),
  ('Star Fruit',         '⭐', '1', '20K', '30K',  88, 210, false, 'Seed', 'rare'),
  ('Eclipse Bloom',      '🌑', '1', '45K', '60K',  34, 132, true,  'Seed', 'legendary'),
  -- Gear / Dụng cụ
  ('Super Watering Can', '🫖', '1', '10K', '20K',  80, 305, false, 'Gear', 'rare'),
  ('Super Sprinkler',    '⛲', '1', '10K', '20K',  74, 277, false, 'Gear', 'rare'),
  -- Pet / Thú cưng
  ('Raccoon',            '🦝', '1', '40K', '55K',  42, 156, false, 'Pet',  'epic'),
  ('Black Dragon',       '🐉', '1', '80K', '100K', 18,  98, true,  'Pet',  'legendary'),
  ('Ice Serpent',        '🐍', '1', '60K', '80K',  25, 112, false, 'Pet',  'legendary'),
  ('Golden Dragonfly',   '🪰', '1', '55K', '70K',  30,  87, false, 'Pet',  'epic'),
  ('Unicorn',            '🦄', '1', '90K', '120K', 12,  64, true,  'Pet',  'legendary')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM products);

-- Seed contact info
INSERT INTO contact (handle, hours)
SELECT 'sohaynho01', '8h - 24h hằng ngày'
WHERE NOT EXISTS (SELECT 1 FROM contact);

-- ============================================
-- MIGRATION: thêm customer_id vào orders (nếu bảng đã tồn tại từ trước)
-- ============================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ============================================
-- MIGRATION: thêm image_url vào products (nếu bảng đã tồn tại từ trước)
-- ============================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================
-- MIGRATION: đổi danh mục 'Item hiếm' -> 'Pet' (nếu DB đã tồn tại từ trước)
-- Bỏ CHECK cũ, cập nhật dữ liệu, thêm CHECK mới.
-- ============================================
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
UPDATE products SET category = 'Pet' WHERE category = 'Item hiếm';
ALTER TABLE products
  ADD CONSTRAINT products_category_check CHECK (category IN ('Seed', 'Gear', 'Pet'));



