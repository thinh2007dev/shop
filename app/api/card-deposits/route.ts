import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Danh sách nhà mạng hợp lệ
const TELCOS = ["Viettel", "Mobifone", "Vinaphone", "Vietnamobile", "Zing", "Garena", "Gate"];

// POST /api/card-deposits - Khách gửi thẻ cào để admin duyệt.
// Body: { customer_id, telco, amount?, card_serial, card_code }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer_id = String(body.customer_id || "");
    const telco = String(body.telco || "").trim();
    const amount = Number(body.amount) || null;
    const card_serial = String(body.card_serial || "").trim();
    const card_code = String(body.card_code || "").trim();

    if (!customer_id) {
      return NextResponse.json({ error: "Thiếu thông tin tài khoản" }, { status: 400 });
    }
    if (!TELCOS.includes(telco)) {
      return NextResponse.json({ error: "Loại thẻ không hợp lệ" }, { status: 400 });
    }
    if (!card_serial || !card_code) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ mã thẻ và số serial" }, { status: 400 });
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

    const { data: card, error } = await supabaseAdmin
      .from("card_deposits")
      .insert({ customer_id, telco, amount, card_serial, card_code, status: "pending" })
      .select("id, telco, amount, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}

// GET /api/card-deposits?id=... - Kiểm tra trạng thái lệnh nạp thẻ.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("card_deposits")
    .select("id, telco, amount, received_amount, status, completed_at")
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
