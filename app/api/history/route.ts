import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/history?id=<customer_id>
// Trả về lịch sử mua hàng + nạp tiền của 1 tài khoản
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  const [ordersRes, depositsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, order_code, gift_username, quantity, amount, payment_method, total_price, status, created_at, products(name, emoji)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("deposits")
      .select("id, code, amount, received_amount, status, created_at, completed_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (ordersRes.error) {
    return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  }
  if (depositsRes.error) {
    return NextResponse.json({ error: depositsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: ordersRes.data || [],
    deposits: depositsRes.data || [],
  });
}
