import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://placeholder.supabase.co";

function resolveUrl(raw?: string): string {
  if (!raw) return FALLBACK_URL;
  try {
    const u = new URL(raw.trim());
    if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
    return FALLBACK_URL;
  } catch {
    return FALLBACK_URL;
  }
}

const supabaseUrl = resolveUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

// Server-only client — bỏ qua RLS. TUYỆT ĐỐI không import vào client component.
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
