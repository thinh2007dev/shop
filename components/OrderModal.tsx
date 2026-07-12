"use client";

import { useState, useEffect } from "react";
import { Product, RARITY_LABEL, FALLBACK_CONTACT, fetchContact, createOrder } from "@/lib/products";

export default function OrderModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContact().then(setContact);
  }, []);

  async function order() {
    if (product.id) {
      setSubmitting(true);
      try {
        await createOrder({
          customer_name: "Khách hàng",
          product_id: product.id,
          quantity: qty,
          payment_method: "bank",
          total_price: product.price_bank,
        });
      } catch {
        // Fallback: vẫn hiện thông báo
      } finally {
        setSubmitting(false);
      }
    }

    alert(
      `Đơn: ${qty} combo × ${product.name}\n` +
        `Giá BANK: ${product.price_bank}/${product.unit} — CARD: ${product.price_card}/${product.unit}\n\n` +
        `Vui lòng nhắn Zalo/Facebook: ${contact.handle} để chốt đơn nhé!`
    );
    onClose();
  }

  return (
    <div
      className="modal-bg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal r-${product.rarity}`}>
        <button className="close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
        <div className="mhead">
          <div className="ico">{product.emoji}</div>
          <div>
            <h3>{product.name}</h3>
            <div className="rar">
              {RARITY_LABEL[product.rarity]} · Combo {product.unit} · {product.category}
            </div>
          </div>
        </div>
        <div className="mprice">
          <div>
            <div className="k">Giá Bank</div>
            <div className="v" style={{ color: "var(--accent)" }}>
              {product.price_bank} / {product.unit}
            </div>
          </div>
          <div>
            <div className="k">Giá Card</div>
            <div className="v" style={{ color: "var(--blue)" }}>
              {product.price_card} / {product.unit}
            </div>
          </div>
        </div>
        <div className="qty">
          <label>Số lượng combo:</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <button className="cbtn" onClick={order} disabled={submitting}>
          {submitting ? "Đang xử lý..." : "Đặt hàng ngay"}
        </button>
        <div className="hint">
          Bấm đặt hàng để liên hệ Zalo/Facebook <b>{contact.handle}</b> chốt đơn.
        </div>
      </div>
    </div>
  );
}