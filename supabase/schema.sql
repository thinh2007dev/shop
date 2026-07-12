-- ============================================
-- GAG2 Shop - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  unit TEXT NOT NULL DEFAULT '1',
  price_bank TEXT NOT NULL,
  price_card TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  hot BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('Seed', 'Gear', 'Item hiếm')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
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
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Public read access for contact
CREATE POLICY "Contact is viewable by everyone"
  ON contact FOR SELECT
  USING (true);

-- Public can create orders
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Public can read recent orders (for feed)
CREATE POLICY "Orders are viewable by everyone"
  ON orders FOR SELECT
  USING (true);

-- ============================================
-- SEED DATA - Initial products
-- ============================================
INSERT INTO products (name, emoji, unit, price_bank, price_card, stock, sold, hot, category, rarity) VALUES
  ('Dragon Seed',        '🔥', '1',  '9K',  '20K', 99, 412, true,  'Seed',      'legendary'),
  ('Hypyo Moon x10',     '🌱', '10', '30K', '40K', 57, 230, false, 'Seed',      'epic'),
  ('Moon Bloom x10',     '🪷', '10', '30K', '40K', 63, 198, false, 'Item hiếm', 'epic'),
  ('Ghost Pepper x10',   '🌶️', '10', '50K', '70K', 28, 145, true,  'Item hiếm', 'legendary'),
  ('Super Watering x40', '🫖', '40', '10K', '20K', 80, 305, false, 'Gear',      'rare'),
  ('Super Sprinkler x30','⛲', '30', '10K', '20K', 74, 277, false, 'Gear',      'rare');

-- Seed contact info
INSERT INTO contact (handle, hours) VALUES
  ('sohaynho01', '8h - 24h hằng ngày');