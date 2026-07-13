import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// POST /api/admin/reseed - Xoá toàn bộ products cũ + seed lại danh sách chuẩn.
// Route tạm để đồng bộ DB, xoá sau khi chạy xong.
const PRODUCTS = [
  { name: "Dragon Breathe", emoji: "🔥", unit: "1", price_bank: "9K", price_card: "20K", stock: 99, sold: 412, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Moon Bloom", emoji: "🪷", unit: "1", price_bank: "30K", price_card: "40K", stock: 63, sold: 198, hot: false, category: "Seed", rarity: "epic" },
  { name: "Ghost Pepper", emoji: "🌶️", unit: "1", price_bank: "50K", price_card: "70K", stock: 28, sold: 145, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Sun Bloom", emoji: "🌻", unit: "1", price_bank: "25K", price_card: "35K", stock: 71, sold: 168, hot: false, category: "Seed", rarity: "epic" },
  { name: "Star Fruit", emoji: "⭐", unit: "1", price_bank: "20K", price_card: "30K", stock: 88, sold: 210, hot: false, category: "Seed", rarity: "rare" },
  { name: "Eclipse Bloom", emoji: "🌑", unit: "1", price_bank: "45K", price_card: "60K", stock: 34, sold: 132, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Super Watering Can", emoji: "🫖", unit: "1", price_bank: "10K", price_card: "20K", stock: 80, sold: 305, hot: false, category: "Gear", rarity: "rare" },
  { name: "Super Sprinkler", emoji: "⛲", unit: "1", price_bank: "10K", price_card: "20K", stock: 74, sold: 277, hot: false, category: "Gear", rarity: "rare" },
  { name: "Raccoon", emoji: "🦝", unit: "1", price_bank: "40K", price_card: "55K", stock: 42, sold: 156, hot: false, category: "Pet", rarity: "epic" },
  { name: "Black Dragon", emoji: "🐉", unit: "1", price_bank: "80K", price_card: "100K", stock: 18, sold: 98, hot: true, category: "Pet", rarity: "legendary" },
  { name: "Ice Serpent", emoji: "🐍", unit: "1", price_bank: "60K", price_card: "80K", stock: 25, sold: 112, hot: false, category: "Pet", rarity: "legendary" },
  { name: "Golden Dragonfly", emoji: "🪰", unit: "1", price_bank: "55K", price_card: "70K", stock: 30, sold: 87, hot: false, category: "Pet", rarity: "epic" },
  { name: "Unicorn", emoji: "🦄", unit: "1", price_bank: "90K", price_card: "120K", stock: 12, sold: 64, hot: true, category: "Pet", rarity: "legendary" },
];

export async function POST() {
  // Xoá sạch products cũ (orders.product_id đã ON DELETE SET NULL nên an toàn)
  const del = await supabaseAdmin.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (del.error) {
    return NextResponse.json({ step: "delete", error: del.error.message }, { status: 500 });
  }

  const ins = await supabaseAdmin.from("products").insert(PRODUCTS).select("name, category");
  if (ins.error) {
    return NextResponse.json({ step: "insert", error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: ins.data?.length ?? 0, items: ins.data });
}
