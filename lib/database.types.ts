export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Category = "Seed" | "Gear" | "Item hiếm";

export interface ProductRow {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  price_bank: string;
  price_card: string;
  stock: number;
  sold: number;
  hot: boolean;
  category: Category;
  rarity: Rarity;
  created_at: string;
}

export interface OrderRow {
  id: string;
  customer_name: string;
  product_id: string;
  quantity: number;
  payment_method: "bank" | "card";
  total_price: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
}

export interface ContactRow {
  id: string;
  handle: string;
  hours: string;
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: ProductRow;
        Insert: Omit<ProductRow, "id" | "created_at">;
        Update: Partial<Omit<ProductRow, "id" | "created_at">>;
      };
      orders: {
        Row: OrderRow;
        Insert: Omit<OrderRow, "id" | "created_at">;
        Update: Partial<Omit<OrderRow, "id" | "created_at">>;
      };
      contact: {
        Row: ContactRow;
        Insert: Omit<ContactRow, "id">;
        Update: Partial<Omit<ContactRow, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}