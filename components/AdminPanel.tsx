"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fmtVnd, productImage, type Product } from "@/lib/products";

type Stats = {
  revenue: number;
  depositCount: number;
  orderCount: number;
  pendingOrders: number;
  completedOrders: number;
  customerCount: number;
};

type AdminProduct = Product & { id: string; image_url: string | null };

type AdminOrder = {
  id: string;
  order_code: string | null;
  gift_username: string | null;
  customer_name: string;
  quantity: number;
  amount: number;
  total_price: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  products: { name: string; emoji: string } | null;
};

const CATEGORIES: Product["category"][] = ["Seed", "Gear", "Pet"];
const CAT_LABEL: Record<string, string> = { Seed: "🌱 Seed", Gear: "⚙️ Gear", Pet: "🐾 Pet" };

function fmtDate(s: string) {
  return new Date(s).toLocaleString("vi-VN");
}

function parsePriceValue(product: AdminProduct): number {
  if (typeof product.price === "number" && product.price > 0) return product.price;
  const raw = String(product.price_bank || "").trim().toUpperCase();
  const num = Number(raw.replace(/[^0-9]/g, ""));
  if (!num) return 0;
  return raw.includes("K") ? num * 1000 : num;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "products" | "orders">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const headers = user ? { "x-admin-id": user.id } : undefined;

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const h = { "x-admin-id": user.id };
      const [s, p, o] = await Promise.all([
        fetch("/api/admin/stats", { headers: h }),
        fetch("/api/admin/products", { headers: h }),
        fetch("/api/admin/orders", { headers: h }),
      ]);
      if (s.ok) setStats(await s.json());
      if (p.ok) setProducts(await p.json());
      if (o.ok) setOrders(await o.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
  }

  // ---- Cập nhật sản phẩm ----
  async function saveProduct(id: string, patch: Partial<AdminProduct>) {
    if (!headers) return;
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      flash("Đã lưu ✔");
    } else {
      const e = await res.json();
      flash(e.error || "Lưu thất bại");
    }
  }

  // ---- Đổi trạng thái đơn ----
  async function setOrderStatus(id: string, status: AdminOrder["status"]) {
    if (!headers) return;
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      loadAll();
    }
  }

  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <h2>🛠️ Trang quản lý</h2>
          <p>Xin chào {user?.display_name || user?.username} · Bảng điều khiển admin</p>
        </div>
        <button className="admin-refresh" onClick={loadAll}>↻ Làm mới</button>
      </div>

      {msg && <div className="admin-toast">{msg}</div>}

      <div className="admin-tabs">
        <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>
          📊 Tổng quan
        </button>
        <button className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}>
          📦 Sản phẩm
        </button>
        <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>
          🎁 Đơn hàng {stats?.pendingOrders ? `(${stats.pendingOrders})` : ""}
        </button>
      </div>

      {loading ? (
        <div className="admin-empty">Đang tải…</div>
      ) : tab === "overview" ? (
        <OverviewTab stats={stats} />
      ) : tab === "products" ? (
        <ProductsTab products={products} onSave={saveProduct} />
      ) : (
        <OrdersTab orders={orders} onStatus={setOrderStatus} />
      )}
    </div>
  );
}

// ============ TAB: TỔNG QUAN ============
function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) return <div className="admin-empty">Không có dữ liệu.</div>;
  return (
    <>
      <div className="admin-revenue">
        <div className="rev-label">💰 Tổng doanh thu (tiền khách đã nạp)</div>
        <div className="rev-value">{fmtVnd(stats.revenue)}</div>
        <div className="rev-note">
          Chỉ tính tiền nạp vào ví · không tính tiền mua sản phẩm
        </div>
      </div>
      <div className="admin-cards">
        <div className="stat-card">
          <div className="sc-num">{stats.depositCount}</div>
          <div className="sc-label">Lượt nạp thành công</div>
        </div>
        <div className="stat-card">
          <div className="sc-num">{stats.orderCount}</div>
          <div className="sc-label">Tổng đơn hàng</div>
        </div>
        <div className="stat-card warn">
          <div className="sc-num">{stats.pendingOrders}</div>
          <div className="sc-label">Đơn chờ xử lý</div>
        </div>
        <div className="stat-card ok">
          <div className="sc-num">{stats.completedOrders}</div>
          <div className="sc-label">Đơn hoàn thành</div>
        </div>
        <div className="stat-card">
          <div className="sc-num">{stats.customerCount}</div>
          <div className="sc-label">Tài khoản khách</div>
        </div>
      </div>
    </>
  );
}

// ============ TAB: SẢN PHẨM ============
function ProductsTab({
  products,
  onSave,
}: {
  products: AdminProduct[];
  onSave: (id: string, patch: Partial<AdminProduct>) => void;
}) {
  return (
    <div className="admin-products">
      {CATEGORIES.map((cat) => {
        const list = products.filter((p) => p.category === cat);
        if (list.length === 0) return null;
        return (
          <div className="apg" key={cat}>
            <h3 className="apg-title">{CAT_LABEL[cat]}</h3>
            <div className="apg-grid">
              {list.map((p) => (
                <ProductEditor key={p.id} product={p} onSave={onSave} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductEditor({
  product,
  onSave,
}: {
  product: AdminProduct;
  onSave: (id: string, patch: Partial<AdminProduct>) => void;
}) {
  const [price, setPrice] = useState(String(parsePriceValue(product)));
  const [stock, setStock] = useState(String(product.stock ?? 0));
  const [image, setImage] = useState(product.image_url || "");

  const dirty =
    Number(price) !== parsePriceValue(product) ||
    Number(stock) !== (product.stock ?? 0) ||
    (image || "") !== (product.image_url || "");

  return (
    <div className="ape">
      <div className="ape-top">
        <div className="ape-img">
          <img src={image || productImage(product)} alt={product.name} />
        </div>
        <div className="ape-info">
          <div className="ape-name">{product.name}</div>
          <div className="ape-sub">Đã bán {product.sold}</div>
        </div>
      </div>

      <label className="ape-field">
        <span>Giá (VND)</span>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="vd 5000"
        />
      </label>
      <label className="ape-field">
        <span>Kho (stock)</span>
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </label>
      <label className="ape-field">
        <span>Link ảnh</span>
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Dán URL ảnh vào đây"
        />
      </label>

      <div className="ape-preview">
        Giá hiển thị: <b>{Number(price) > 0 ? fmtVnd(Number(price)) : "—"}</b>
      </div>

      <button
        className="ape-save"
        disabled={!dirty}
        onClick={() =>
          onSave(product.id, {
            price: Number(price) || 0,
            stock: Number(stock) || 0,
            image_url: image || null,
          })
        }
      >
        {dirty ? "Lưu thay đổi" : "Đã lưu"}
      </button>
    </div>
  );
}

// ============ TAB: ĐƠN HÀNG (CARD GIFT) ============
const OST: Record<string, { label: string; cls: string }> = {
  pending: { label: "Đang chờ xử lý", cls: "st-pending" },
  completed: { label: "Thành công", cls: "st-ok" },
  cancelled: { label: "Đã huỷ", cls: "st-cancel" },
};

function OrdersTab({
  orders,
  onStatus,
}: {
  orders: AdminOrder[];
  onStatus: (id: string, status: AdminOrder["status"]) => void;
}) {
  const pending = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status !== "pending");

  return (
    <div className="admin-orders">
      <h3 className="ao-section">🕒 Cần xử lý — gửi tk:mk:cookie ({pending.length})</h3>
      {pending.length === 0 ? (
        <div className="admin-empty">Không có đơn nào chờ xử lý.</div>
      ) : (
        <div className="ao-grid">
          {pending.map((o) => (
            <OrderCard key={o.id} o={o} onStatus={onStatus} />
          ))}
        </div>
      )}

      <h3 className="ao-section" style={{ marginTop: 26 }}>
        📜 Đã xử lý ({done.length})
      </h3>
      {done.length === 0 ? (
        <div className="admin-empty">Chưa có.</div>
      ) : (
        <div className="ao-grid">
          {done.map((o) => (
            <OrderCard key={o.id} o={o} onStatus={onStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  o,
  onStatus,
}: {
  o: AdminOrder;
  onStatus: (id: string, status: AdminOrder["status"]) => void;
}) {
  const st = OST[o.status] || OST.pending;
  return (
    <div className={`ao-card ${o.status === "pending" ? "hot" : ""}`}>
      <div className="ao-head">
        <span className="ao-code">#{o.order_code || o.id.slice(0, 8)}</span>
        <span className={`ao-badge ${st.cls}`}>{st.label}</span>
      </div>
      <div className="ao-item">
        {o.products?.emoji || "📦"} <b>{o.products?.name || "Sản phẩm"}</b> × {o.quantity}
      </div>
      <div className="ao-gift">
        🎁 Gift cho: <b>{o.gift_username || "—"}</b>
      </div>
      <div className="ao-meta">
        <span>Khách: {o.customer_name}</span>
        <span className="ao-amt">{fmtVnd(o.amount || 0)}</span>
      </div>
      <div className="ao-date">{fmtDate(o.created_at)}</div>
      <div className="ao-actions">
        {o.status !== "completed" && (
          <button className="ao-done" onClick={() => onStatus(o.id, "completed")}>
            ✔ Đã gửi acc
          </button>
        )}
        {o.status === "pending" && (
          <button className="ao-cancel" onClick={() => onStatus(o.id, "cancelled")}>
            ✕ Huỷ
          </button>
        )}
        {o.status === "completed" && (
          <button className="ao-reopen" onClick={() => onStatus(o.id, "pending")}>
            ↩ Mở lại
          </button>
        )}
      </div>
    </div>
  );
}
