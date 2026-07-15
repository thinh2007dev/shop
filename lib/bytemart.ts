// Nhận tiền tự động qua Bytemart (đọc lịch sử giao dịch MB Bank).
// Không dùng webhook SePay nữa — server chủ động poll API này để khớp lệnh nạp.

import { supabaseAdmin } from "@/lib/supabase-admin";
import { extractCode } from "@/lib/sepay";

// ==== CẤU HÌNH — set trong .env ====
// BYTEMART_TOKEN: token cấp bởi bytemart.io.vn (đặt trong .env, KHÔNG hardcode)
const BYTEMART_TOKEN = process.env.BYTEMART_TOKEN || "";
const BYTEMART_CLIENT_URL = "https://api.bytemart.io.vn/historyapimbbank";

export function bytemartConfigured(): boolean {
  return Boolean(BYTEMART_TOKEN);
}

// 1 giao dịch từ API Bytemart (MB Bank)
export interface BytemartTran {
  tranId: string;
  postingDate: string;
  transactionDate: string;
  accountNo: string;
  creditAmount: string;   // tiền vào (string số)
  debitAmount: string;    // tiền ra
  currency: string;
  description: string;
  availableBalance: string;
  beneficiaryAccount: string | null;
}

interface BytemartResponse {
  status: string;
  message: string;
  TranList?: BytemartTran[];
}

// Gọi API lấy lịch sử giao dịch. Trả về [] nếu lỗi/không cấu hình.
export async function fetchTransactions(): Promise<BytemartTran[]> {
  if (!BYTEMART_TOKEN) return [];

  const url = `${BYTEMART_CLIENT_URL}/${encodeURIComponent(BYTEMART_TOKEN)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as BytemartResponse;
    if (data.status !== "success" || !Array.isArray(data.TranList)) return [];
    return data.TranList;
  } catch {
    return [];
  }
}

// Quét lịch sử giao dịch, khớp mã nạp trong nội dung CK -> cộng tiền (atomic qua RPC).
// Chỉ xử lý tiền VÀO (creditAmount > 0). Chống trùng bằng tranId (lưu vào sepay_tx_id).
// Trả về số lệnh nạp vừa hoàn tất.
export async function syncDeposits(): Promise<number> {
  const trans = await fetchTransactions();
  if (trans.length === 0) return 0;

  let completed = 0;
  for (const t of trans) {
    const credit = Math.round(Number(t.creditAmount) || 0);
    if (credit <= 0) continue; // bỏ qua tiền ra

    const code = extractCode(t.description);
    if (!code) continue;

    const txId = t.tranId;
    const { data } = await supabaseAdmin.rpc("complete_deposit", {
      p_code: code,
      p_amount: credit,
      p_tx_id: txId,
    });
    if (data) completed++;
  }
  return completed;
}
