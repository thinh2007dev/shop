import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { extractCode } from "@/lib/sepay";

export const dynamic = "force-dynamic";

// ============================================
// POST /api/webhook/sepay
// SePay bắn webhook về đây mỗi khi có giao dịch vào tài khoản.
// Cấu hình trên SePay: https://my.sepay.vn -> Tích hợp Webhooks
//   - URL: https://<domain>/api/webhook/sepay
//   - Kiểu xác thực: API Key (Header)
//   - Giá trị: đặt = SEPAY_WEBHOOK_API_KEY (SePay gửi "Authorization: Apikey <key>")
//
// Luồng: rút mã GAG2xxxxxx từ nội dung CK -> gọi RPC complete_deposit
//   (atomic, chống nạp trùng qua sepay_tx_id) -> cộng tiền vào ví khách.
// ============================================

interface SepayPayload {
  id?: number | string;          // id giao dịch trên SePay (unique)
  gateway?: string;              // ngân hàng
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;          // mã do SePay tự parse (nếu bật rule)
  content?: string;              // nội dung chuyển khoản đầy đủ
  transferType?: string;         // "in" = tiền vào, "out" = tiền ra
  transferAmount?: number;       // số tiền
  referenceCode?: string;        // mã tham chiếu ngân hàng
  description?: string;
}

function authorized(request: Request): boolean {
  const expected = process.env.SEPAY_WEBHOOK_API_KEY;
  // Chưa cấu hình key -> từ chối để tránh cộng tiền khống.
  if (!expected) return false;

  const header = request.headers.get("authorization") || "";
  // SePay gửi dạng: "Apikey <key>". Chấp nhận cả "Bearer <key>" và key trần.
  const token = header.replace(/^(Apikey|Bearer)\s+/i, "").trim();
  return token === expected;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: SepayPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  // Chỉ xử lý tiền VÀO
  if (body.transferType && body.transferType !== "in") {
    return NextResponse.json({ success: true, message: "Ignored (not incoming)" });
  }

  const amount = Math.round(Number(body.transferAmount) || 0);
  if (amount <= 0) {
    return NextResponse.json({ success: true, message: "Ignored (zero amount)" });
  }

  // Rút mã nạp: ưu tiên field code do SePay parse, fallback nội dung + description
  const code =
    extractCode(body.code || "") ||
    extractCode(body.content || "") ||
    extractCode(body.description || "");

  if (!code) {
    // Không có mã khớp -> ghi nhận nhưng không cộng (CK không rõ khách nào).
    return NextResponse.json({ success: true, message: "No deposit code matched" });
  }

  const txId = String(body.id || body.referenceCode || `${code}-${Date.now()}`);

  const { data, error } = await supabaseAdmin.rpc("complete_deposit", {
    p_code: code,
    p_amount: amount,
    p_tx_id: txId,
  });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  if (!data) {
    // Không match lệnh pending, hoặc đã xử lý (trùng tx). Trả 200 để SePay không retry.
    return NextResponse.json({ success: true, message: "No pending deposit or already processed" });
  }

  return NextResponse.json({ success: true, customer_id: data, code, amount });
}
