import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ADMIN_USERNAME = "sohaynho01";
const ADMIN_PASSWORD = "0945753494Huy@@";

async function customersHaveIsAdmin(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("customers")
    .select("is_admin")
    .limit(1);
  return !error;
}

// POST /api/admin/setup - Create or reset the default admin account.
export async function POST() {
  const username = ADMIN_USERNAME.toLowerCase();
  const hasIsAdmin = await customersHaveIsAdmin();

  const { data: existing } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {
      password_hash: hashPassword(ADMIN_PASSWORD),
      display_name: "Admin",
    };
    if (hasIsAdmin) patch.is_admin = true;

    const { error } = await supabaseAdmin
      .from("customers")
      .update(patch)
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: "updated", id: existing.id, username, has_is_admin: hasIsAdmin });
  }

  const row: Record<string, unknown> = {
    username,
    password_hash: hashPassword(ADMIN_PASSWORD),
    display_name: "Admin",
  };
  if (hasIsAdmin) row.is_admin = true;

  const { data, error } = await supabaseAdmin
    .from("customers")
    .insert(row)
    .select("id, username")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, action: "created", ...data, has_is_admin: hasIsAdmin });
}
