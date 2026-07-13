-- ============================================
-- SECURITY LOCKDOWN
-- Chạy trong Supabase SQL Editor SAU schema.sql
-- ============================================
-- Lý do: web này KHÔNG truy cập DB trực tiếp từ trình duyệt.
-- Mọi thao tác đi qua API route (server) dùng SERVICE ROLE KEY.
-- Service role BỎ QUA RLS, nên ta khóa sạch quyền của anon key.
-- => anon key lộ trong bundle JS cũng vô hại (không đọc/ghi được gì).
-- ============================================

-- 1) Bật RLS cho MỌI bảng (deposits trước đây chưa bật)
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits  ENABLE ROW LEVEL SECURITY;

-- 2) Gỡ hết policy công khai cũ (cho phép anon đọc/ghi tự do)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Contact is viewable by everyone"   ON contact;
DROP POLICY IF EXISTS "Anyone can create orders"          ON orders;
DROP POLICY IF EXISTS "Orders are viewable by everyone"   ON orders;

-- 3) KHÔNG tạo policy mới cho anon.
--    RLS bật + không có policy nào = anon bị TỪ CHỐI mọi thao tác.
--    Service role (dùng ở server) tự động bỏ qua RLS nên web vẫn chạy bình thường.

-- ============================================
-- KIỂM TRA sau khi chạy:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
--   -> rowsecurity phải = true cho tất cả bảng.
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname='public';
--   -> nên trống (không còn policy công khai nào).
-- ============================================
