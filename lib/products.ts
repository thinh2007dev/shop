export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Product = {
  id?: string;
  name: string;
  emoji: string;
  unit: string;
  price_bank: string;
  price_card: string;
  stock: number;
  sold: number;
  hot: boolean;
  category: "Seed" | "Gear" | "Item hiếm";
  rarity: Rarity;
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Thường",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
};

// Fallback data khi Supabase chưa kết nối
export const FALLBACK_PRODUCTS: Product[] = [
  { name: "Dragon Seed", emoji: "🔥", unit: "1", price_bank: "9K", price_card: "20K", stock: 99, sold: 412, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Hypyo Moon x10", emoji: "🌱", unit: "10", price_bank: "30K", price_card: "40K", stock: 57, sold: 230, hot: false, category: "Seed", rarity: "epic" },
  { name: "Moon Bloom x10", emoji: "🪷", unit: "10", price_bank: "30K", price_card: "40K", stock: 63, sold: 198, hot: false, category: "Item hiếm", rarity: "epic" },
  { name: "Ghost Pepper x10", emoji: "🌶️", unit: "10", price_bank: "50K", price_card: "70K", stock: 28, sold: 145, hot: true, category: "Item hiếm", rarity: "legendary" },
  { name: "Super Watering x40", emoji: "🫖", unit: "40", price_bank: "10K", price_card: "20K", stock: 80, sold: 305, hot: false, category: "Gear", rarity: "rare" },
  { name: "Super Sprinkler x30", emoji: "⛲", unit: "30", price_bank: "10K", price_card: "20K", stock: 74, sold: 277, hot: false, category: "Gear", rarity: "rare" },
];

export const FALLBACK_CONTACT = {
  handle: "sohaynho01",
  hours: "8h - 24h hằng ngày",
};

// API fetch functions
export async function fetchProducts(category?: string): Promise<Product[]> {
  try {
    const params = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
    const res = await fetch(`/api/products${params}`);
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function fetchContact(): Promise<{ handle: string; hours: string }> {
  try {
    const res = await fetch("/api/contact");
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch {
    return FALLBACK_CONTACT;
  }
}

export async function createOrder(order: {
  customer_name: string;
  product_id: string;
  quantity: number;
  payment_method: "bank" | "card";
  total_price: string;
}) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Lỗi tạo đơn hàng");
  }
  return await res.json();
}