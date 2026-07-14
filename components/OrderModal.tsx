"use client";

import { useState } from "react";
import {
  Product,
  RARITY_LABEL,
  displayPrice,
  productImage,
  purchaseProduct,
} from "@/lib/products";
import { useAuth } from "@/lib/auth-context";

export default function OrderModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { user, refreshBalance } = useAuth();
  const [qtyInput, setQtyInput] = useState("1");
  const qty = Math.max(1, Number(qtyInput) || 1);
  const [gift, setGift] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; amount: number; balance: number } | null>(null);

  const unitPrice = typeof product.price === "number" ? product.price : 0;
  const total = unitPrice * qty;
  const balance = user?.balance ?? 0;
  const enough = balance >= total && unitPrice > 0;

  async function buy() {
    setError("");
    if (!user || !product.id) {
      setError("Vui lòng đăng nhập lại.");
      return;
    }
    if (!gift.trim()) {
      setError("Nhập username Roblox nhận gift.");
      return;
    }
    if (unitPrice <= 0) {
      setError("Sản phẩm chưa có giá, liên hệ shop.");
      return;
    }
    if (!enough) {
      setError("Số dư không đủ. Vui lòng nạp thêm.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await purchaseProduct({
        customer_id: user.id,
        product_id: product.id,
        quantity: qty,
        gift_username: gift.trim(),
      });
      await refreshBalance();
      setDone({ code: res.order_code, amount: res.amount, balance: res.balance });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mua hàng thất bại");
    } finally {
      setSubmitting(false);
    }
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

        {done ? (
          <div className="order-success">
            <div className="os-check">✅</div>
            <h3>Đặt hàng thành công!</h3>
            <div className="os-code">Mã đơn: <b>{done.code}</b></div>
            <p className="os-line">
              Đã trừ <b>{done.amount.toLocaleString("vi-VN")}đ</b> · Số dư còn{" "}
              <b>{done.balance.toLocaleString("vi-VN")}đ</b>
            </p>
            <p className="os-note">
              Shop sẽ gửi <b>{product.name}</b> tới tài khoản Roblox{" "}
              <b>{gift.trim()}</b> trong ít phút. Theo dõi ở mục <b>Lịch sử</b>.
            </p>
            <button className="cbtn" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <>
            <div className="mhead">
              <div className="ico">
                <img src={productImage(product)} alt={product.name} loading="lazy" />
              </div>
              <div>
                <h3>{product.name}</h3>
                <div className="rar">
                  {RARITY_LABEL[product.rarity]} · Combo {product.unit} · {product.category}
                </div>
              </div>
            </div>

            <div className="mprice">
              <div>
                <div className="k">Đơn giá</div>
                <div className="v" style={{ color: "var(--accent)" }}>
                  {displayPrice(product)}
                </div>
              </div>
              <div>
                <div className="k">Số dư của bạn</div>
                <div className="v" style={{ color: enough ? "var(--green)" : "var(--gold)" }}>
                  {balance.toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>

            <div className="qty">
              <label>Số lượng:</label>
              <input
                type="number"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={() => setQtyInput(String(qty))}
              />
            </div>

            <div className="gift-field">
              <label>Username Roblox nhận gift:</label>
              <input
                type="text"
                value={gift}
                onChange={(e) => setGift(e.target.value)}
                placeholder="Nhập username Roblox của bạn"
              />
            </div>

            <div className="order-total">
              <span>Tổng thanh toán</span>
              <b>{unitPrice > 0 ? total.toLocaleString("vi-VN") + "đ" : "—"}</b>
            </div>

            {error && <div className="order-err">{error}</div>}

            <button className="cbtn" onClick={buy} disabled={submitting}>
              {submitting ? "Đang xử lý..." : enough ? "Mua ngay bằng số dư" : "Số dư không đủ"}
            </button>
            <div className="hint">
              Tiền được trừ trực tiếp từ ví. Chưa đủ? Vào mục <b>Nạp tiền</b> để nạp thêm.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
