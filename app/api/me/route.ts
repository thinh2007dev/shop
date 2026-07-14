import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ADMIN_USERNAME = "sohaynho01";

// GET /api/me?id=... - Lấy thông tin + số dư tài khoản
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  // Thử select kèm is_admin; nếu cột chưa migrate thì fallback không có is_admin
  const withAdmin = await supabaseAdmin
    .from("customers")
    .select("id, username, display_name, balance, is_admin")
    .eq("id", id)
    .maybeSingle();

  let data = withAdmin.data as
    | { id: string; username: string; display_name: string | null; balance: number; is_admin?: boolean }
    | null;

  if (withAdmin.error) {
    const withoutAdmin = await supabaseAdmin
      .from("customers")
      .select("id, username, display_name, balance")
      .eq("id", id)
      .maybeSingle();

    if (withoutAdmin.error) {
      return NextResponse.json({ error: withoutAdmin.error.message }, { status: 500 });
    }
    data = withoutAdmin.data
      ? { ...withoutAdmin.data, is_admin: withoutAdmin.data.username === ADMIN_USERNAME }
      : null;
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    balance: data.balance ?? 0,
    is_admin: data.is_admin || data.username === ADMIN_USERNAME || false,
  });
}
