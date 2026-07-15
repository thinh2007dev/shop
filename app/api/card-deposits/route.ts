import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

// GET: Lấy thông tin thẻ đã nạp
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("card_deposits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Trả về số tiền thực nhận sau chiết khấu (nếu đã duyệt)
  if (data.status === "completed") {
    return NextResponse.json({
      ...data,
      amount: calcFinal(data.amount),
    });
  }

  return NextResponse.json(data);
}

// POST: Tạo lệnh nạp thẻ
export async function POST(request: Request) {
  const body = await request.json();
  const { customer_id, telco, amount, card_serial, card_code } = body;

  if (!customer_id || !telco || !amount || !card_serial || !card_code) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("card_deposits")
    .insert({
      customer_id,
      telco,
      amount,
      card_serial,
      card_code,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Không tạo được lệnh nạp thẻ" }, { status: 500 });
  }

  return NextResponse.json(data);
}
