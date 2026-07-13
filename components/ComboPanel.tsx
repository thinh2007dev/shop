"use client";

import { useMemo, useState } from "react";
import {
  Combo,
  ComboCategory,
  COMBO_CAT_LABEL,
  FALLBACK_COMBOS,
  comboToProduct,
  fmtQty,
  fmtVnd,
} from "@/lib/products";
import OrderModal from "./OrderModal";

const SUB_TABS: ComboCategory[] = ["Gear", "Seed", "Pet", "Mixed"];

export default function ComboPanel({ compact = false }: { compact?: boolean }) {
  const [sub, setSub] = useState<ComboCategory>("Gear");
  const [selected, setSelected] = useState<Combo | null>(null);

  const list = useMemo(
    () => FALLBACK_COMBOS.filter((c) => c.category === sub),
    [sub]
  );

  // Gom combo theo item để hiển thị từng bảng bậc giá
  const groups = useMemo(() => {
    const map = new Map<string, Combo[]>();
    for (const c of list) {
      const arr = map.get(c.item) || [];
      arr.push(c);
      map.set(c.item, arr);
    }
    return Array.from(map.entries());
  }, [list]);

  return (
    <section className={`combo${compact ? " combo-compact" : ""}`}>
      {!compact && (
      <div className="combo-head">
        <div className="combo-eyebrow">COMBO ƯU ĐÃI</div>
        <h1 className="combo-title">Combo Grow a Garden 2</h1>
        <p className="combo-sub">
          Mua combo số lượng lớn để nhận giá tốt hơn. Chọn loại combo bên dưới.
        </p>
      </div>
      )}

      <div className="combo-subtabs">
        {SUB_TABS.map((t) => (
          <button
            key={t}
            className={`combo-subpill${sub === t ? " on" : ""}`}
            onClick={() => setSub(t)}
          >
            {COMBO_CAT_LABEL[t]}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="combo-empty">
          🚧 Combo {COMBO_CAT_LABEL[sub]} đang được cập nhật. Quay lại sau nhé!
        </div>
      ) : (
        groups.map(([item, combos]) => (
          <div className="combo-group" key={item}>
            <h3 className="combo-group-title">
              {combos[0].emoji} {item}
            </h3>
            <div className="combo-grid">
              {combos.map((c) => (
                <div className={`combo-card${c.hot ? " hot" : ""}`} key={c.id}>
                  {c.hot && <span className="combo-tag">🔥 Bán chạy</span>}
                  <div className="combo-qty">{fmtQty(c.quantity)}</div>
                  <div className="combo-qty-label">{item}</div>
                  <div className="combo-price">{fmtVnd(c.price)}</div>
                  <button className="combo-buy" onClick={() => setSelected(c)}>
                    Mua combo
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {selected && (
        <OrderModal
          product={comboToProduct(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
