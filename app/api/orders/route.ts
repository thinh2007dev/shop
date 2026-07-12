import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/orders - Lấy đơn hàng gần đây (cho feed)
export async function GET() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(name, emoji, price_bank)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/orders - Tạo đơn hàng mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, product_id, quantity, payment_method, total_price } = body;

    if (!customer_name || !product_id || !quantity || !payment_method || !total_price) {
      return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name,
        product_id,
        quantity,
        payment_method,
        total_price,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Update product sold count and stock
    const { error: updateError } = await supabase.rpc("increment_sold", {
      p_id: product_id,
      qty: quantity,
    });

    // If rpc doesn't exist, do manual update
    if (updateError) {
      const { data: product } = await supabase
        .from("products")
        .select("stock, sold")
        .eq("id", product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({
            sold: product.sold + quantity,
            stock: Math.max(0, product.stock - quantity),
          })
          .eq("id", product_id);
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}