import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/card-deposits - Danh sách thẻ cào khách gửi (kèm username) để admin duyệt.
export async function GET(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("card_deposits")
    .select(
      "id, telco, amount, card_serial, card_code, received_amount, status, created_at, completed_at, customers(username, display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/admin/card-deposits - Duyệt hoặc từ chối thẻ cào.
// Body: { id: string, action: "approve" | "reject", amount?: number }
// - approve: cộng tiền vào ví khách (atomic, chống duyệt trùng)
// - reject:  đánh dấu rejected, không cộng tiền
export async function PATCH(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  let body: { id?: unknown; action?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }

  const id = String(body.id || "");
  const action = String(body.action || "");
  const amount = body.amount != null ? Math.round(Number(body.amount)) : null;

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("card_deposits")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id, status: "rejected" });
  }

  // approve -> RPC atomic cộng tiền
  const { data, error } = await supabaseAdmin.rpc("admin_complete_card_deposit", {
    p_card_id: id,
    p_amount: amount,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Lệnh nạp thẻ không tồn tại, đã xử lý, hoặc thiếu số tiền" },
      { status: 400 }
    );
  }

  return NextResponse.json({ id, status: "completed", customer_id: data });
}
