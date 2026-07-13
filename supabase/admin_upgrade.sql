-- ============================================
-- GAG2 Shop - Nâng cấp Admin + Ví/Mua bằng số dư
-- Chạy toàn bộ file này trong Supabase SQL Editor.
-- An toàn chạy lại nhiều lần (idempotent).
-- ============================================

-- 1) Cờ admin cho tài khoản
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2) Giá số (VND) cho sản phẩm — admin chỉnh giá này, shop hiển thị theo đây
ALTER TABLE products ADD COLUMN IF NOT EXISTS price BIGINT NOT NULL DEFAULT 0;

-- Suy ra price ban đầu từ price_bank (vd '9K' -> 9000) cho các sản phẩm chưa có giá
UPDATE products
SET price = (NULLIF(regexp_replace(price_bank, '[^0-9]', '', 'g'), ''))::BIGINT * 1000
WHERE price = 0 AND price_bank ~ '[0-9]';

-- 3) Bổ sung cột cho orders: mã đơn, username nhận gift, số tiền đã trừ
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_username TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount BIGINT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code) WHERE order_code IS NOT NULL;

-- ============================================
-- RPC: Mua hàng bằng số dư (atomic)
-- Khoá dòng customer + product, kiểm tra số dư & tồn kho,
-- trừ tiền, trừ kho, tăng sold, tạo order.
-- Trả JSONB: { ok, error?, order_id?, order_code?, amount?, balance? }
-- ============================================
CREATE OR REPLACE FUNCTION purchase_product(
  p_customer_id UUID,
  p_product_id UUID,
  p_qty INTEGER,
  p_gift_username TEXT,
  p_order_code TEXT,
  p_customer_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bal BIGINT;
  v_price BIGINT;
  v_stock INTEGER;
  v_total BIGINT;
  v_order_id UUID;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Số lượng không hợp lệ');
  END IF;
  IF p_gift_username IS NULL OR length(btrim(p_gift_username)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Thiếu username nhận gift');
  END IF;

  SELECT balance INTO v_bal FROM customers WHERE id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tài khoản không tồn tại');
  END IF;

  SELECT price, stock INTO v_price, v_stock FROM products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sản phẩm không tồn tại');
  END IF;

  IF v_price IS NULL OR v_price <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sản phẩm chưa được đặt giá');
  END IF;
  IF v_stock < p_qty THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Không đủ hàng trong kho');
  END IF;

  v_total := v_price * p_qty;
  IF v_bal < v_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Số dư không đủ');
  END IF;

  UPDATE customers SET balance = balance - v_total WHERE id = p_customer_id;
  UPDATE products SET stock = stock - p_qty, sold = sold + p_qty WHERE id = p_product_id;

  INSERT INTO orders (customer_name, customer_id, product_id, quantity, payment_method, total_price, status, order_code, gift_username, amount)
  VALUES (p_customer_name, p_customer_id, p_product_id, p_qty, 'bank', v_total::text, 'pending', p_order_code, btrim(p_gift_username), v_total)
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_code', p_order_code,
    'amount', v_total,
    'balance', v_bal - v_total
  );
END;
$$;
