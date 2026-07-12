import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/login - Đăng nhập
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from("customers")
      .select("id, username, display_name, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Sai tên đăng nhập hoặc mật khẩu" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
    });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
