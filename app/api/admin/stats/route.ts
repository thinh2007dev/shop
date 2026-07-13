import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/stats - Thống kê cho admin
// Doanh thu = TỔNG TIỀN KHÁCH ĐÃ NẠP (deposits completed), KHÔNG tính tiền mua hàng.
export async function GET(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  // Tổng tiền nạp thành công
  const { data: deps, error: depErr } = await supabaseAdmin
    .from("deposits")
    .select("received_amount, amount, status")
    .eq("status", "completed");

  if (depErr) {
    return NextResponse.json({ error: depErr.message }, { status: 500 });
  }

  const revenue = (deps || []).reduce(
    (sum, d) => sum + Number(d.received_amount ?? d.amount ?? 0),
    0
  );

  // Đếm đơn theo trạng thái
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("status");

  const orderCount = orders?.length || 0;
  const pendingOrders = (orders || []).filter((o) => o.status === "pending").length;
  const completedOrders = (orders || []).filter((o) => o.status === "completed").length;

  // Số tài khoản khách
  const { count: customerCount } = await supabaseAdmin
    .from("customers")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    revenue,
    depositCount: deps?.length || 0,
    orderCount,
    pendingOrders,
    completedOrders,
    customerCount: customerCount || 0,
  });
}
