"use client";

import { useState, useEffect } from "react";
import {
  Product,
  RARITY_LABEL,
  FALLBACK_PRODUCTS,
  fetchProducts,
  displayPrice,
  productImage,
} from "@/lib/products";
import ComboPanel from "./ComboPanel";
import OrderModal from "./OrderModal";

type FilterKey = "all" | "Seed" | "Gear" | "Pet" | "combo";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "Seed", label: "Seeds" },
  { key: "Gear", label: "Gear" },
  { key: "Pet", label: "Pets" },
  { key: "combo", label: "Combo" },
];

// Ước tính thời gian giao theo category
const ETA: Record<Product["category"], string> = {
  Seed: "5-10 min",
  Gear: "5-10 min",
  Pet: "10-15 min",
};

// Chữ viết tắt cố định cho từng sản phẩm
const ABBR: Record<string, string> = {
  "Dragon Breathe": "DB",
  "Moon Bloom": "MB",
  "Ghost Pepper": "GP",
  "Sun Bloom": "SB",
  "Star Fruit": "SF",
  "Eclipse Bloom": "EB",
  "Super Watering Can": "SWC",
  "Super Sprinkler": "SS",
  Raccoon: "RC",
  "Black Dragon": "BD",
  "Ice Serpent": "IS",
  "Golden Dragonfly": "GD",
  Unicorn: "UC",
};

// Fallback: lấy chữ cái đầu của 2-3 từ đầu tiên
function abbreviate(name: string): string {
  if (ABBR[name]) return ABBR[name];
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Catalog() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts().then((data) => {
      if (data.length > 0) setProducts(data);
    });
  }, []);

  const list =
    filter === "all" || filter === "combo"
      ? products
      : products.filter((p) => p.category === filter);

  return (
    <section className="cat">
      <div className="cat-head">
        <div className="cat-eyebrow">CATALOG</div>
        <h1 className="cat-title">Grow a Garden 2 items</h1>
        <p className="cat-sub">
          Browse items available for this game by category. Login is required to
          add items to your cart.
        </p>
      </div>

      <div className="cat-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cat-pill${filter === f.key ? " on" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "combo" ? (
        <ComboPanel compact />
      ) : (
      <div className="cat-grid">
        {list.map((p) => {
          const id = p.id || p.name;
          const lowStock = p.stock <= 20;
          return (
            <article className="cat-card" key={id}>
              <div className="cat-thumb">
                <div className="cat-thumb-inner">
                  <img src={productImage(p)} alt={p.name} loading="lazy" />
                  <span className="cat-abbr fallback">{abbreviate(p.name)}</span>
                </div>
              </div>

              <div className="cat-body">
                <div className="cat-row-top">
                  <span className="cat-game">Grow a Garden 2</span>
                  {p.hot && <span className="cat-badge b-popular">Popular</span>}
                </div>

                <h3 className="cat-name">{p.name}</h3>

                <div className="cat-tags">
                  <span className="cat-tag">{p.category}</span>
                  <span className="cat-tag">{RARITY_LABEL[p.rarity]}</span>
                  <span className={`cat-tag stock${lowStock ? " limited" : ""}`}>
                    {lowStock ? "Limited" : "In stock"}: {p.stock}
                  </span>
                </div>

                <div className="cat-eta">Estimated {ETA[p.category]}</div>

                <div className="cat-price-block">
                  <div className="cat-price-label">PRICE</div>
                  <div className="cat-price-row">
                    <span className="cat-price">{displayPrice(p)}</span>
                    <span className="cat-price-tag bank">/{p.unit}</span>
                  </div>
                </div>

                <div className="cat-actions">
                  <button
                    className="cat-btn primary"
                    onClick={() => setSelected(p)}
                  >
                    Mua ngay
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      )}

      {selected && (
        <OrderModal product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
