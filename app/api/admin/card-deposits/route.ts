import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

// Bảng chiết khấu theo mệnh giá (%)
const CARD_RATES: Record<number, number> = {
  10000: 0.147,  // 14.7%
  20000: 0.147,  // 14.7%
  30000: 0.147,  // 14.7%
  50000: 0.109,  // 10.9%
  100000: 0.123, // 12.3%
  200000: 0.123, // 12.3%
  300000: 0.123, // 12.3%
  500000: 0.123, // 12.3%
  1000000: 0.123, // 12.3%
};

function getDiscountRate(amount: number): number {
  return CARD_RATES[amount] ?? 0.25; // Mặc định 25% nếu không có
}

function calcFinal(amount: number): number {
  return Math.floor(amount * (1 - getDiscountRate(amount)));
}

export async function GET(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("card_deposits")
    .select("*, customers(username, display_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Lỗi truy vấn" }, { status: 500 });
  return NextResponse.json(data || []);
}

// PATCH: Duyệt hoặc từ chối thẻ nạp
export async function PATCH(request: Request) {
  const adminId = request.headers.get("x-admin-id");
  if (!(await isAdmin(adminId))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, action, amount } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  // Lấy thông tin thẻ
  const { data: card, error: fetchError } = await supabaseAdmin
    .from("card_deposits")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
  }

  if (card.status !== "pending") {
    return NextResponse.json({ error: "Thẻ đã được xử lý" }, { status: 400 });
  }

  if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("card_deposits")
      .update({ status: "rejected" })
      .eq("id", id);
    
    if (error) return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
    }

    // Tính số tiền thực nhận sau chiết khấu
    const discountRate = getDiscountRate(amount);
    const discountPercent = Math.round(discountRate * 100);
    const finalAmount = calcFinal(amount);

    // Cập nhật trạng thái thẻ
    const { error: updateError } = await supabaseAdmin
      .from("card_deposits")
      .update({
        status: "completed",
        received_amount: finalAmount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
    }

    // Cộng tiền vào tài khoản khách
    const { error: balanceError } = await supabaseAdmin.rpc("increment_balance", {
      p_customer_id: card.customer_id,
      p_amount: finalAmount,
    });

    if (balanceError) {
      // Rollback
      await supabaseAdmin
        .from("card_deposits")
        .update({ status: "pending", received_amount: null })
        .eq("id", id);
      return NextResponse.json({ error: "Cộng tiền thất bại, đã rollback" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Đã cộng ${finalAmount.toLocaleString("vi-VN")}đ (sau chiết khấu ${discountPercent}%)`
    });
  }

  return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
}
