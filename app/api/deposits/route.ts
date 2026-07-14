import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  generateDepositCode,
  buildQrUrl,
  sepayConfigured,
  SEPAY_BANK,
  SEPAY_ACCOUNT,
  SEPAY_ACCOUNT_NAME,
} from "@/lib/sepay";


export const dynamic = "force-dynamic";

// POST /api/deposits - Tạo lệnh nạp tiền, trả về mã CK + QR
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer_id = String(body.customer_id || "");
    const amount = Number(body.amount) || null;

    if (!sepayConfigured()) {
      return NextResponse.json(
        { error: "Hệ thống nạp tiền chưa được cấu hình. Vui lòng liên hệ admin." },
        { status: 503 }
      );
    }

    if (!customer_id) {
      return NextResponse.json({ error: "Thiếu thông tin tài khoản" }, { status: 400 });
    }

    if (amount !== null && amount < 10000) {
      return NextResponse.json({ error: "Số tiền nạp tối thiểu 10.000đ" }, { status: 400 });
    }

    // Xác thực customer tồn tại
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("id", customer_id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    // Sinh mã duy nhất (retry nếu trùng)
    let code = generateDepositCode();
    for (let i = 0; i < 5; i++) {
      const { data: dup } = await supabaseAdmin
        .from("deposits")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!dup) break;
      code = generateDepositCode();
    }

    const { data: deposit, error } = await supabaseAdmin
      .from("deposits")
      .insert({ customer_id, code, amount, status: "pending" })
      .select("id, code, amount, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ...deposit,
      qr_url: buildQrUrl(code, amount || undefined),
      bank: SEPAY_BANK,
      account: SEPAY_ACCOUNT,
      account_name: SEPAY_ACCOUNT_NAME,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}

// GET /api/deposits?id=... - Kiểm tra trạng thái lệnh nạp.
// Admin duyệt tay: chỉ đọc trạng thái hiện tại từ DB (không gọi API bank).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("deposits")
    .select("id, code, amount, received_amount, status, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy lệnh nạp" }, { status: 404 });
  }

  return NextResponse.json(data);
}


