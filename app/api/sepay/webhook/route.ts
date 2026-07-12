import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DEPOSIT_PREFIX } from "@/lib/sepay";

export const dynamic = "force-dynamic";

// ============================================
// Bot tự động nhận tiền — Webhook SePay
// SePay gọi endpoint này mỗi khi có tiền vào tài khoản.
// Payload mẫu: https://docs.sepay.vn/tich-hop-webhooks.html
// {
//   id, gateway, transactionDate, accountNumber,
//   transferType: "in" | "out", transferAmount,
//   content, description, referenceCode, ...
// }
// ============================================

// Rút mã nạp (vd GAG2X7K9Q2) từ nội dung chuyển khoản
function extractCode(text: string): string | null {
  if (!text) return null;
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const re = new RegExp(`${DEPOSIT_PREFIX}[A-Z0-9]{6}`);
  const m = cleaned.match(re);
  return m ? m[0] : null;
}

export async function POST(request: Request) {
  // 1) Xác thực request đến từ SePay bằng token
  const token = process.env.SEPAY_WEBHOOK_TOKEN;
  const auth = request.headers.get("authorization") || "";
  if (token && auth !== `Apikey ${token}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
  }

  // 2) Chỉ xử lý tiền VÀO
  const transferType = String(payload.transferType || "");
  if (transferType !== "in") {
    return NextResponse.json({ success: true, message: "Bỏ qua (không phải tiền vào)" });
  }

  const amount = Math.round(Number(payload.transferAmount) || 0);
  const txId = String(payload.id ?? payload.referenceCode ?? "");
  const content = String(payload.content ?? payload.description ?? "");

  if (amount <= 0 || !txId) {
    return NextResponse.json({ success: false, message: "Thiếu dữ liệu giao dịch" }, { status: 400 });
  }

  // 3) Tìm mã nạp trong nội dung CK
  const code = extractCode(content);
  if (!code) {
    // Không khớp lệnh nào — vẫn trả 200 để SePay không retry mãi
    return NextResponse.json({ success: true, message: "Không tìm thấy mã nạp trong nội dung" });
  }

  // 4) Cộng tiền atomic qua RPC (match code + chống trùng txId)
  const { data: customerId, error } = await supabaseAdmin.rpc("complete_deposit", {
    p_code: code,
    p_amount: amount,
    p_tx_id: txId,
  });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  if (!customerId) {
    // Không có lệnh pending khớp, hoặc đã xử lý trước đó
    return NextResponse.json({ success: true, message: "Không có lệnh chờ khớp / đã xử lý" });
  }

  return NextResponse.json({
    success: true,
    message: "Đã cộng tiền",
    code,
    amount,
    customer_id: customerId,
  });
}
