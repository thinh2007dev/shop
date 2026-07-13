import { createClient } from "@supabase/supabase-js";

function requireUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL. Set biến môi trường này (local: .env.local, prod: Vercel Project Settings > Environment Variables)."
    );
  }
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL không hợp lệ: ${raw}`);
    }
    return u.origin;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL không phải URL hợp lệ: ${raw}`);
  }
}

function requireServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY. Set biến môi trường này (local: .env.local, prod: Vercel Project Settings > Environment Variables)."
    );
  }
  return key;
}

// Server-only client — bỏ qua RLS. TUYỆT ĐỐI không import vào client component.
export const supabaseAdmin = createClient(requireUrl(), requireServiceKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});
