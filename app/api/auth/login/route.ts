import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ADMIN_USERNAME = "sohaynho01";
const ADMIN_PASSWORD = "0945753494Huy@@";

async function findCustomer(username: string) {
  const withAdmin = await supabaseAdmin
    .from("customers")
    .select("id, username, display_name, password_hash, balance, is_admin")
    .eq("username", username)
    .maybeSingle();

  if (!withAdmin.error) return withAdmin.data;

  const withoutAdmin = await supabaseAdmin
    .from("customers")
    .select("id, username, display_name, password_hash, balance")
    .eq("username", username)
    .maybeSingle();

  return withoutAdmin.data
    ? { ...withoutAdmin.data, is_admin: username === ADMIN_USERNAME }
    : null;
}

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" }, { status: 400 });
    }

    const user = await findCustomer(username);
    const isHardcodedAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (!user || (!isHardcodedAdmin && !verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Sai tên đăng nhập hoặc mật khẩu" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      balance: user.balance ?? 0,
      is_admin: isHardcodedAdmin || user.is_admin || false,
    });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
