import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/orders - Toàn bộ đơn hàng (kèm tên sản phẩm + username gift)
// Dùng cho "card đơn hàng" để admin tra đơn và giao tk:mk:cookie.
export async function GET(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_code, gift_username, customer_name, quantity, amount, total_price, status, created_at, products(name, emoji)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/admin/orders - Đổi trạng thái đơn (pending -> completed / cancelled)
export async function PATCH(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !["pending", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id, order_code, gift_username, customer_name, quantity, amount, total_price, status, created_at, products(name, emoji)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
