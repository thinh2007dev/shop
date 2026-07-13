import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function formatShortPrice(value: number): string {
  if (value > 0 && value % 1000 === 0) return `${value / 1000}K`;
  return String(value);
}

async function productsHaveColumn(column: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("products")
    .select(column)
    .limit(1);
  return !error;
}

// GET /api/admin/products - Toàn bộ sản phẩm (mọi danh mục) cho trang quản lý
export async function GET(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/admin/products - Cập nhật giá / kho / ảnh 1 sản phẩm
export async function PATCH(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Thiếu id sản phẩm" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (body.price !== undefined) {
      const price = Math.max(0, Number(body.price) || 0);
      patch.price_bank = formatShortPrice(price);
      patch.price_card = formatShortPrice(price);
      if (await productsHaveColumn("price")) patch.price = price;
    }
    if (body.stock !== undefined) patch.stock = Math.max(0, Number(body.stock) || 0);
    if (body.image_url !== undefined && await productsHaveColumn("image_url")) {
      patch.image_url = body.image_url || null;
    }
    if (body.hot !== undefined) patch.hot = !!body.hot;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Không có gì để cập nhật" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  }
}
