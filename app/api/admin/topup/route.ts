import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/admin/topup - Admin cộng/trừ tiền ví cho tài khoản đã tồn tại.
// Body: { username: string, amount: number }  (amount âm để trừ)
export async function POST(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  let body: { username?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }

  const username = String(body.username ?? "").trim();
  const amount = Math.round(Number(body.amount) || 0);

  if (!username) {
    return NextResponse.json({ error: "Thiếu tên đăng nhập" }, { status: 400 });
  }
  if (!amount) {
    return NextResponse.json({ error: "Số tiền phải khác 0" }, { status: 400 });
  }

  // Thử RPC atomic trước
  const rpc = await supabaseAdmin.rpc("admin_adjust_balance", {
    p_username: username,
    p_amount: amount,
  });

  if (!rpc.error) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    if (!row) {
      return NextResponse.json(
        { error: `Không tìm thấy tài khoản "${username}"` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      username: row.username,
      display_name: row.display_name,
      balance: Number(row.balance),
      added: amount,
    });
  }

  // Fallback nếu RPC chưa được migrate: đọc rồi cập nhật trực tiếp (admin bypass RLS)
  const { data: cust, error: findErr } = await supabaseAdmin
    .from("customers")
    .select("id, username, display_name, balance")
    .ilike("username", username)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if (!cust) {
    return NextResponse.json(
      { error: `Không tìm thấy tài khoản "${username}"` },
      { status: 404 }
    );
  }

  const newBalance = Number(cust.balance || 0) + amount;
  const { data: updated, error: updErr } = await supabaseAdmin
    .from("customers")
    .update({ balance: newBalance })
    .eq("id", cust.id)
    .select("username, display_name, balance")
    .single();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    username: updated.username,
    display_name: updated.display_name,
    balance: Number(updated.balance),
    added: amount,
  });
}
