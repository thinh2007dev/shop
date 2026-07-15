-- ============================================
-- Thêm sản phẩm mới vào GAG2 Shop
-- Run this in Supabase SQL Editor
-- ============================================

-- Thêm 3 Seed mới (Legendary)
INSERT INTO products (name, emoji, unit, price_bank, price_card, stock, sold, hot, category, rarity)
VALUES
  ('Venus Fly Trap', '🪴', '1', '50K', '70K', 30, 0, true, 'Seed', 'legendary'),
  ('Hypno Bloom', '🌀', '1', '45K', '65K', 25, 0, true, 'Seed', 'legendary'),
  ('Venom Spitter', '🌿', '1', '40K', '55K', 35, 0, false, 'Seed', 'legendary');

-- Thêm 1 Gear mới (Legendary)
INSERT INTO products (name, emoji, unit, price_bank, price_card, stock, sold, hot, category, rarity)
VALUES
  ('Legendary Sprinkler', '💧', '1', '25K', '35K', 50, 0, false, 'Gear', 'legendary');

-- Thêm 1 Pet mới (Legendary)
INSERT INTO products (name, emoji, unit, price_bank, price_card, stock, sold, hot, category, rarity)
VALUES
  ('Firefly', '✨', '1', '60K', '80K', 40, 0, false, 'Pet', 'legendary');
