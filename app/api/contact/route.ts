import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/contact - Lấy thông tin liên hệ
export async function GET() {
  const { data, error } = await supabase.from("contact").select("*").limit(1).single();

  if (error) {
    // Fallback nếu chưa có data trong Supabase
    return NextResponse.json({ handle: "sohaynho01", hours: "8h - 24h hằng ngày" });
  }

  return NextResponse.json(data);
}