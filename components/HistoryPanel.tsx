"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

type OrderRow = {
  id: string;
  order_code: string | null;
  gift_username: string | null;
  quantity: number;
  amount: number;
  payment_method: string;
  total_price: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  products: { name: string; emoji: string } | null;
};

type DepositRow = {
  id: string;
  code: string;
  amount: number | null;
  received_amount: number | null;
  status: "pending" | "completed" | "expired";
  created_at: string;
  completed_at: string | null;
};

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Đang xử lý", cls: "st-pending" },
  completed: { label: "Thành công", cls: "st-ok" },
  cancelled: { label: "Đã huỷ", cls: "st-cancel" },
};

const DEP_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Đang xử lý", cls: "st-pending" },
  completed: { label: "Thành công", cls: "st-ok" },
  expired: { label: "Hết hạn", cls: "st-cancel" },
};

function fmtMoney(n: number | null) {
  return (n || 0).toLocaleString("vi-VN") + "đ";
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString("vi-VN");
}

export default function HistoryPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"orders" | "deposits">("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/history?id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setDeposits(data.deposits || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>🧾 Lịch sử giao dịch</h2>
        <p>Đơn hàng đã mua và các lần nạp tiền của bạn.</p>
      </div>

      <div className="auth-tabs hist-tabs">
        <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>
          🛒 Mua hàng ({orders.length})
        </button>
        <button className={tab === "deposits" ? "on" : ""} onClick={() => setTab("deposits")}>
          💰 Nạp tiền ({deposits.length})
        </button>
      </div>

      {loading ? (
        <div className="hist-empty">Đang tải…</div>
      ) : tab === "orders" ? (
        orders.length === 0 ? (
          <div className="hist-empty">Chưa có đơn hàng nào.</div>
        ) : (
          <div className="hist-list">
            {orders.map((o) => {
              const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
              return (
                <div className="hist-row" key={o.id}>
                  <div className="hist-ico">{o.products?.emoji || "📦"}</div>
                  <div className="hist-main">
                    <div className="hist-title">
                      {o.products?.name || "Sản phẩm"} × {o.quantity}
                    </div>
                    <div className="hist-sub">
                      Mã đơn {o.order_code || o.id.slice(0, 8)} · Gift cho {o.gift_username || "chưa có"} · {fmtDate(o.created_at)}
                    </div>
                  </div>
                  <div className="hist-right">
                    <div className="hist-amt red">-{fmtMoney(o.amount || Number(o.total_price) || 0)}</div>
                    <span className={`hist-badge ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : deposits.length === 0 ? (
        <div className="hist-empty">Chưa có lần nạp nào.</div>
      ) : (
        <div className="hist-list">
          {deposits.map((d) => {
            const st = DEP_STATUS[d.status] || DEP_STATUS.pending;
            const shown = d.received_amount ?? d.amount;
            return (
              <div className="hist-row" key={d.id}>
                <div className="hist-ico">💳</div>
                <div className="hist-main">
                  <div className="hist-title">Nạp tiền · {d.code}</div>
                  <div className="hist-sub">{fmtDate(d.created_at)}</div>
                </div>
                <div className="hist-right">
                  <div className="hist-amt green">+{fmtMoney(shown)}</div>
                  <span className={`hist-badge ${st.cls}`}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
