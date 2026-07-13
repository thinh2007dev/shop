import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_USERNAME = "sohaynho01";

// Server-side admin check. It still works before the optional is_admin column is migrated.
export async function isAdmin(customerId: string | null | undefined): Promise<boolean> {
  if (!customerId) return false;

  const withAdmin = await supabaseAdmin
    .from("customers")
    .select("username, is_admin")
    .eq("id", customerId)
    .maybeSingle();

  if (!withAdmin.error) {
    return !!withAdmin.data?.is_admin || withAdmin.data?.username === ADMIN_USERNAME;
  }

  const withoutAdmin = await supabaseAdmin
    .from("customers")
    .select("username")
    .eq("id", customerId)
    .maybeSingle();

  return withoutAdmin.data?.username === ADMIN_USERNAME;
}
