-- ============================================
-- RESET + RESEED products
-- Chạy trong Supabase SQL Editor khi DB đang chứa data cũ
-- (vd: "Dragon Seed", "Hypyo Moon x10") không khớp danh sách chuẩn.
--
-- Danh sách chuẩn:
--   Seed: Dragon Breathe, Moon Bloom, Ghost Pepper, Sun Bloom, Star Fruit, Eclipse Bloom
--   Gear: Super Watering Can, Super Sprinkler
--   Pet:  Raccoon, Black Dragon, Ice Serpent, Golden Dragonfly, Unicorn
-- ============================================

-- Gỡ ràng buộc FK tạm thời không cần: orders.product_id ON DELETE SET NULL
-- nên xoá products an toàn (orders cũ chỉ mất tham chiếu).
DELETE FROM products;

INSERT INTO products (name, emoji, unit, price_bank, price_card, stock, sold, hot, category, rarity)
VALUES
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
  ('Unicorn',            '🦄', '1', '90K', '120K', 12,  64, true,  'Pet',  'legendary');

-- Kiểm tra:
SELECT category, name FROM products ORDER BY category, name;
