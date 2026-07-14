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


