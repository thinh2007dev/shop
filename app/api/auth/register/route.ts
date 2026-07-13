import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/register - Đăng ký tài khoản mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.display_name || "").trim() || null;

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: "Tên đăng nhập tối thiểu 3 ký tự" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    // Kiểm tra trùng username
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
    }

    const password_hash = hashPassword(password);

    const { data: user, error } = await supabaseAdmin
      .from("customers")
      .insert({ username, password_hash, display_name: displayName })
      .select("id, username, display_name")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Body JSON hỏng -> 400. Còn lại (fetch failed, thiếu env, DB down) -> 500 + log.
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
    }
    console.error("[register] error:", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}


