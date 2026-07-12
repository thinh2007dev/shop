"use client";

import { useState, useEffect } from "react";
import { Product, RARITY_LABEL, FALLBACK_PRODUCTS, fetchProducts } from "@/lib/products";
import OrderModal from "./OrderModal";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        if (data.length > 0) setProducts(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="products" id="products">
        {products.map((p, i) => {
          const total = p.stock + p.sold;
          const pct = Math.round((p.stock / total) * 100);
          return (
            <div
              className={`card r-${p.rarity}${loading ? " loading" : ""}`}
              key={p.id || p.name}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="inner">
                {p.hot && <span className="tag-hot">🔥 HOT</span>}
                <div className="top">
                  <div className="ico">{p.emoji}</div>
                  <div>
                    <div className="name">{p.name}</div>
                    <div className="rarity">
                      <i />
                      {RARITY_LABEL[p.rarity]} · {p.category}
                    </div>
                  </div>
                </div>
                <div className="meta">
                  <span>Kho: <b>{p.stock}</b></span>
                  <span className="sold">Đã bán: <b>{p.sold}</b></span>
                </div>
                <div className="bar">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <div className="prices">
                  <div className="pbox bank">
                    <div className="k">Bank</div>
                    <div className="v">
                      {p.price_bank}
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>/{p.unit}</span>
                    </div>
                  </div>
                  <div className="pbox card-p">
                    <div className="k">Card</div>
                    <div className="v">
                      {p.price_card}
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>/{p.unit}</span>
                    </div>
                  </div>
                </div>
                <button className="buy" onClick={() => setSelected(p)}>
                  Mua ngay
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <OrderModal product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}