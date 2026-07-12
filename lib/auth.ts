import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Hash mật khẩu: scrypt + salt ngẫu nhiên. Format lưu: "salt:hash" (hex)
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

// So khớp mật khẩu với hash đã lưu (timing-safe)
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const keyBuf = new Uint8Array(Buffer.from(key, "hex"));
  const derived = new Uint8Array(scryptSync(password, salt, 64));
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);

}
