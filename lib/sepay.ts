// Helper cho SePay / VietQR

export const SEPAY_BANK = process.env.NEXT_PUBLIC_SEPAY_BANK || "MBBank";
export const SEPAY_ACCOUNT = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT || "";
export const SEPAY_ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NAME || "";

// Prefix nội dung chuyển khoản. SePay match phần này trong "nội dung CK".
// Chỉ dùng chữ + số để tránh bank lọc ký tự đặc biệt.
export const DEPOSIT_PREFIX = "GAG2";

// Sinh mã nạp duy nhất, vd: GAG2X7K9Q2
export function generateDepositCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${DEPOSIT_PREFIX}${s}`;
}

// Kiểm tra cấu hình SePay đã đủ chưa (tránh sinh QR lỗi khi thiếu STK).
export function sepayConfigured(): boolean {
  return Boolean(SEPAY_ACCOUNT && SEPAY_BANK);
}

// Rút mã nạp (vd GAG2X7K9Q2) từ nội dung chuyển khoản.
export function extractCode(text: string): string | null {
  if (!text) return null;
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const re = new RegExp(`${DEPOSIT_PREFIX}[A-Z0-9]{6}`);
  const m = cleaned.match(re);
  return m ? m[0] : null;
}

// Một giao dịch tiền vào lấy từ SePay API.
export interface SepayTx {
  id: string;
  amount: number;
  content: string;
}

// Gọi SePay API lấy các giao dịch TIỀN VÀO gần đây (thay cho webhook).
// Docs: https://docs.sepay.vn/api-giao-dich.html
// Cần SEPAY_API_TOKEN (User API Token trong SePay -> Cấu hình -> API Access).
export async function fetchSepayIncoming(limit = 20): Promise<SepayTx[]> {
  const token = process.env.SEPAY_API_TOKEN;
  if (!token) throw new Error("Thiếu SEPAY_API_TOKEN");

  const params = new URLSearchParams({ limit: String(limit) });
  if (SEPAY_ACCOUNT) params.set("account_number", SEPAY_ACCOUNT);

  const res = await fetch(
    `https://my.sepay.vn/userapi/transactions/list?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`SePay API lỗi ${res.status}`);
  }

  const json = (await res.json()) as {
    transactions?: Array<Record<string, unknown>>;
  };

  const list = json.transactions || [];
  return list
    .map((t) => ({
      id: String(t.id ?? t.reference_number ?? ""),
      amount: Math.round(Number(t.amount_in) || 0),
      content: String(t.transaction_content ?? ""),
    }))
    .filter((t) => t.id && t.amount > 0);
}


// URL ảnh QR động của SePay (VietQR). Quét là ra sẵn STK + nội dung + số tiền.
// Docs: https://qr.sepay.vn/img
export function buildQrUrl(code: string, amount?: number): string {
  if (!sepayConfigured()) {
    throw new Error(
      "SePay chưa được cấu hình: thiếu NEXT_PUBLIC_SEPAY_ACCOUNT hoặc NEXT_PUBLIC_SEPAY_BANK"
    );
  }
  const params = new URLSearchParams({
    acc: SEPAY_ACCOUNT,
    bank: SEPAY_BANK,
    des: code,
    template: "compact",
  });
  if (amount && amount > 0) params.set("amount", String(amount));
  return `https://qr.sepay.vn/img?${params.toString()}`;
}


