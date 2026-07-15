export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Product = {
  id?: string;
  name: string;
  emoji: string;
  image_url?: string | null;

  unit: string;
  price?: number;
  price_bank: string;
  price_card: string;
  stock: number;
  sold: number;
  hot: boolean;
  category: "Seed" | "Gear" | "Pet";
  rarity: Rarity;
};

// Định dạng tiền VND, vd 5000 -> "5.000đ"
export function fmtVnd(n: number): string {
  return (n || 0).toLocaleString("vi-VN") + "đ";
}

// Giá hiển thị của sản phẩm: ưu tiên cột price (số admin đặt)
export function displayPrice(p: Product): string {
  if (typeof p.price === "number" && p.price > 0) return fmtVnd(p.price);
  return p.price_bank || "—";
}


export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Thường",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
};

// Màu gradient nền theo độ hiếm — dùng cho ảnh tự sinh
const RARITY_GRAD: Record<Rarity, [string, string]> = {
  common: ["#8b97ab", "#3a4256"],
  rare: ["#5eb3ff", "#1a7aff"],
  epic: ["#b57bff", "#6a2fd6"],
  legendary: ["#ffcf5c", "#ff7a1a"],
};

// Ảnh sản phẩm: ưu tiên image_url thật, nếu chưa có thì tự sinh 1 ảnh SVG
// (gradient theo độ hiếm + emoji ở giữa) để mọi item luôn có ảnh trưng bày.
export function productImage(p: Product): string {
  if (p.image_url) return p.image_url;
  const [c1, c2] = RARITY_GRAD[p.rarity];
  const emoji = p.emoji || "📦";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="s" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stop-color="rgba(255,255,255,0.35)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="120" height="120" rx="20" fill="url(#g)"/>
  <rect width="120" height="120" rx="20" fill="url(#s)"/>
  <text x="60" y="60" font-size="58" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Fallback data khi Supabase chưa kết nối
export const FALLBACK_PRODUCTS: Product[] = [
  // Seed / Hạt giống
  { name: "Dragon Breathe", emoji: "🔥", unit: "1", price_bank: "9K", price_card: "20K", stock: 99, sold: 412, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Moon Bloom", emoji: "🪷", unit: "1", price_bank: "30K", price_card: "40K", stock: 63, sold: 198, hot: false, category: "Seed", rarity: "epic" },
  { name: "Ghost Pepper", emoji: "🌶️", unit: "1", price_bank: "50K", price_card: "70K", stock: 28, sold: 145, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Sun Bloom", emoji: "🌻", unit: "1", price_bank: "25K", price_card: "35K", stock: 71, sold: 168, hot: false, category: "Seed", rarity: "epic" },
  { name: "Star Fruit", emoji: "⭐", unit: "1", price_bank: "20K", price_card: "30K", stock: 88, sold: 210, hot: false, category: "Seed", rarity: "rare" },
  { name: "Eclipse Bloom", emoji: "🌑", unit: "1", price_bank: "45K", price_card: "60K", stock: 34, sold: 132, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Venus Fly Trap", emoji: "🪴", unit: "1", price_bank: "50K", price_card: "70K", stock: 30, sold: 0, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Hypno Bloom", emoji: "🌀", unit: "1", price_bank: "45K", price_card: "65K", stock: 25, sold: 0, hot: true, category: "Seed", rarity: "legendary" },
  { name: "Venom Spitter", emoji: "🌿", unit: "1", price_bank: "40K", price_card: "55K", stock: 35, sold: 0, hot: false, category: "Seed", rarity: "legendary" },
  // Gear / Dụng cụ
  { name: "Super Watering Can", emoji: "🫖", unit: "1", price_bank: "10K", price_card: "20K", stock: 80, sold: 305, hot: false, category: "Gear", rarity: "rare" },
  { name: "Super Sprinkler", emoji: "⛲", unit: "1", price_bank: "10K", price_card: "20K", stock: 74, sold: 277, hot: false, category: "Gear", rarity: "rare" },
  { name: "Legendary Sprinkler", emoji: "💧", unit: "1", price_bank: "25K", price_card: "35K", stock: 50, sold: 0, hot: false, category: "Gear", rarity: "legendary" },
  // Pet / Thú cưng
  { name: "Raccoon", emoji: "🦝", unit: "1", price_bank: "40K", price_card: "55K", stock: 42, sold: 156, hot: false, category: "Pet", rarity: "epic" },
  { name: "Black Dragon", emoji: "🐉", unit: "1", price_bank: "80K", price_card: "100K", stock: 18, sold: 98, hot: true, category: "Pet", rarity: "legendary" },
  { name: "Ice Serpent", emoji: "🐍", unit: "1", price_bank: "60K", price_card: "80K", stock: 25, sold: 112, hot: false, category: "Pet", rarity: "legendary" },
  { name: "Golden Dragonfly", emoji: "🪰", unit: "1", price_bank: "55K", price_card: "70K", stock: 30, sold: 87, hot: false, category: "Pet", rarity: "epic" },
  { name: "Unicorn", emoji: "🦄", unit: "1", price_bank: "90K", price_card: "120K", stock: 12, sold: 64, hot: true, category: "Pet", rarity: "legendary" },
  { name: "Firefly", emoji: "✨", unit: "1", price_bank: "60K", price_card: "80K", stock: 40, sold: 0, hot: false, category: "Pet", rarity: "legendary" },
];

export const FALLBACK_CONTACT = {
  handle: "sohaynho01",
  hours: "8h - 24h hằng ngày",
};

// ============ COMBO ============
export type ComboCategory = "Gear" | "Seed" | "Pet" | "Mixed";

export const COMBO_CAT_LABEL: Record<ComboCategory, string> = {
  Gear: "⚙️ Combo Gear",
  Seed: "🌱 Combo Seed",
  Pet: "🐾 Combo Pets",
  Mixed: "🎁 Combo Thập Cẩm",
};

export type Combo = {
  id: string;
  category: ComboCategory;
  item: string; // tên item, vd "Super Watering Can"
  emoji: string;
  price: number; // VND
  quantity: number; // số lượng nhận được
  hot?: boolean;
};

// Rút gọn số lượng: 1300 -> "1.3K", 666 -> "666"
export function fmtQty(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return (Number.isInteger(k) ? k.toString() : k.toFixed(1).replace(/\.0$/, "")) + "K";
  }
  return String(n);
}

// Tạo các bậc combo cho 1 item gear/seed/pet (theo bảng giá chuẩn)
function tierCombos(
  prefix: string,
  category: ComboCategory,
  item: string,
  emoji: string,
  tiers: Array<[number, number]> // [giá VND, số lượng]
): Combo[] {
  return tiers.map(([price, quantity], i) => ({
    id: `${prefix}-${i}`,
    category,
    item,
    emoji,
    price,
    quantity,
    hot: price === 50000,
  }));
}

const GEAR_TIERS: Array<[number, number]> = [
  [10000, 60],
  [20000, 130],
  [50000, 310],
  [100000, 666],
  [200000, 1300],
];

export const FALLBACK_COMBOS: Combo[] = [
  ...tierCombos("swc", "Gear", "Super Watering Can", "🫖", GEAR_TIERS),
  ...tierCombos("ss", "Gear", "Super Sprinkler", "⛲", GEAR_TIERS),
];

// Tạo 1 Product ảo từ Combo để tái dùng OrderModal
export function comboToProduct(c: Combo): Product {
  return {
    id: c.id,
    name: `${c.item} x${fmtQty(c.quantity)}`,
    emoji: c.emoji,
    unit: `${c.quantity} cái`,
    price: c.price,
    price_bank: fmtVnd(c.price),
    price_card: fmtVnd(c.price),
    stock: 999,
    sold: 0,
    hot: !!c.hot,
    category: c.category === "Mixed" ? "Gear" : c.category,
    rarity: "epic",
  };
}


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
  customer_id?: string;
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

// Mua hàng bằng số dư — trừ tiền ngay, trả về mã đơn + số dư mới
export async function purchaseProduct(input: {
  customer_id: string;
  product_id: string;
  quantity: number;
  gift_username: string;
}): Promise<{ order_id: string; order_code: string; amount: number; balance: number }> {
  const res = await fetch("/api/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Mua hàng thất bại");
  }
  return data;
}

