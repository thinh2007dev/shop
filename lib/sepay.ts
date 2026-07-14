// Helper thanh toán chuyển khoản (VietQR). Không dùng SePay API nữa.

// ==== THÔNG TIN NHẬN TIỀN — SỬA Ở ĐÂY ====
// BANK_ID: mã ngân hàng theo chuẩn VietQR (vd: MB, VCB, TCB, ACB, VPB, BIDV, VIETINBANK, VIETCOMBANK...)
export const BANK_ID = "MB";
export const SEPAY_BANK = "MBBank";        // tên hiển thị
export const SEPAY_ACCOUNT = "0969172706"; // số tài khoản
export const SEPAY_ACCOUNT_NAME = "NGUYEN QUOC HUY"; // chủ tài khoản (viết IN HOA, không dấu)
// ==========================================

// Prefix nội dung chuyển khoản. Chỉ dùng chữ + số để tránh bank lọc ký tự đặc biệt.
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

// Luôn cấu hình sẵn (hardcode) nên trả về true.
export function sepayConfigured(): boolean {
  return Boolean(SEPAY_ACCOUNT && BANK_ID);
}

// Rút mã nạp (vd GAG2X7K9Q2) từ nội dung chuyển khoản.
export function extractCode(text: string): string | null {
  if (!text) return null;
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const re = new RegExp(`${DEPOSIT_PREFIX}[A-Z0-9]{6}`);
  const m = cleaned.match(re);
  return m ? m[0] : null;
}

// URL ảnh QR động VietQR. Quét ra sẵn STK + tên + nội dung + số tiền.
// Docs: https://www.vietqr.io/danh-sach-api/link-tao-ma-qr/
export function buildQrUrl(code: string, amount?: number): string {
  const params = new URLSearchParams({
    accountName: SEPAY_ACCOUNT_NAME,
    addInfo: code,
  });
  if (amount && amount > 0) params.set("amount", String(amount));
  return `https://img.vietqr.io/image/${BANK_ID}-${SEPAY_ACCOUNT}-compact2.png?${params.toString()}`;
}
