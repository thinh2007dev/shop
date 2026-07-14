-- ============================================
-- FIX GIÁ SẢN PHẨM (self-contained, chạy được kể cả khi chưa có cột price)
-- Chạy trong Supabase SQL Editor.
-- Nguyên nhân: cột `price` (RPC dùng để trừ tiền) chưa có / lệch price_bank.
-- ============================================

-- 1) Đảm bảo cột price tồn tại
ALTER TABLE products ADD COLUMN IF NOT EXISTS price BIGINT NOT NULL DEFAULT 0;

-- 2) XEM giá hiện tại (chẩn đoán)
SELECT name, category, price_bank, price
FROM products
ORDER BY category, name;

-- 3) TÍNH LẠI price cho đúng:
--    - "9K"   -> 9000
--    - "9000" -> 9000
UPDATE products
SET price = CASE
  WHEN price_bank ~* 'k'
    THEN (NULLIF(regexp_replace(price_bank, '[^0-9.]', '', 'g'), ''))::NUMERIC * 1000
  ELSE (NULLIF(regexp_replace(price_bank, '[^0-9]', '', 'g'), ''))::NUMERIC
END
WHERE price_bank ~ '[0-9]';

-- 4) KIỂM TRA lại — price phải khớp price_bank
SELECT name, category, price_bank, price
FROM products
ORDER BY category, name;

-- 5) (Tuỳ chọn) Xem số dư khách để đối chiếu
-- SELECT username, display_name, balance FROM customers ORDER BY created_at;
