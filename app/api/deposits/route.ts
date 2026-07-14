import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  generateDepositCode,
  buildQrUrl,
  sepayConfigured,
  fetchSepayIncoming,
  extractCode,
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

// Tự dò giao dịch SePay rồi cộng tiền cho các lệnh pending khớp mã.
// Thay cho webhook: mỗi lần khách poll status, server chủ động hỏi SePay.
// Lỗi khi gọi SePay được nuốt (không chặn việc trả status hiện tại).
async function syncFromSepay(): Promise<void> {
  if (!process.env.SEPAY_API_TOKEN) return;
  let txs;
  try {
    txs = await fetchSepayIncoming(20);
  } catch {
    return; // SePay lỗi/timeout -> bỏ qua, lần poll sau thử lại
  }
  for (const tx of txs) {
    const code = extractCode(tx.content);
    if (!code) continue;
    // complete_deposit là atomic + chống trùng theo sepay_tx_id
    await supabaseAdmin.rpc("complete_deposit", {
      p_code: code,
      p_amount: tx.amount,
      p_tx_id: tx.id,
    });
  }
}

// GET /api/deposits?id=... - Kiểm tra trạng thái lệnh nạp
// Trước khi trả status, tự đồng bộ giao dịch mới từ SePay (không cần webhook).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  // Chủ động dò tiền về từ SePay rồi mới đọc trạng thái mới nhất
  await syncFromSepay();

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


