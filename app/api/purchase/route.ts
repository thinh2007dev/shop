import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Sinh mã đơn hàng duy nhất, vd: DH8F3K2Q
function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `DH${s}`;
}

// POST /api/purchase - Mua hàng bằng số dư (trừ tiền ngay, tạo đơn pending)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer_id = String(body.customer_id || "");
    const product_id = String(body.product_id || "");
    const quantity = Math.max(1, Number(body.quantity) || 1);
    const gift_username = String(body.gift_username || "").trim();

    if (!customer_id || !product_id) {
      return NextResponse.json({ ok: false, error: "Thiếu thông tin đơn hàng" }, { status: 400 });
    }
    if (!gift_username) {
      return NextResponse.json({ ok: false, error: "Vui lòng nhập username nhận gift" }, { status: 400 });
    }

    // Lấy tên hiển thị của khách để lưu vào đơn
    const { data: cust } = await supabaseAdmin
      .from("customers")
      .select("username, display_name")
      .eq("id", customer_id)
      .maybeSingle();
    const customer_name = cust?.display_name || cust?.username || "Khách hàng";

    const order_code = generateOrderCode();

    const { data, error } = await supabaseAdmin.rpc("purchase_product", {
      p_customer_id: customer_id,
      p_product_id: product_id,
      p_qty: quantity,
      p_gift_username: gift_username,
      p_order_code: order_code,
      p_customer_name: customer_name,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    // RPC trả JSONB { ok, error?, ... }
    if (!data || !data.ok) {
      return NextResponse.json({ ok: false, error: data?.error || "Mua hàng thất bại" }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
