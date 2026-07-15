-- ============================================
-- RPC: cộng tiền vào ví theo customer_id (atomic, atomic increment)
-- Dùng cho: duyệt thẻ cào, duyệt lệnh nạp bank, sync Bytemart...
-- ============================================
CREATE OR REPLACE FUNCTION increment_balance(
  p_customer_id UUID,
  p_amount BIGINT
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  UPDATE customers c
  SET balance = c.balance + p_amount
  WHERE c.id = p_customer_id
  RETURNING c.balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found: %', p_customer_id;
  END IF;

  RETURN v_new_balance;
END;
$$;