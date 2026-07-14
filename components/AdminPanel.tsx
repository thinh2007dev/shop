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

type AdminDeposit = {
  id: string;
  code: string;
  amount: number | null;
  received_amount: number | null;
  status: "pending" | "completed" | "expired";
  created_at: string;
  completed_at: string | null;
  customers: { username: string; display_name: string | null } | null;
};

type AdminCardDeposit = {
  id: string;
  telco: string;
  amount: number | null;
  card_serial: string;
  card_code: string;
  received_amount: number | null;
  status: "pending" | "completed" | "rejected";
  created_at: string;
  completed_at: string | null;
  customers: { username: string; display_name: string | null } | null;
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
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "deposits" | "cards" | "topup">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [cards, setCards] = useState<AdminCardDeposit[]>([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const headers = user ? { "x-admin-id": user.id } : undefined;
  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const pendingCards = cards.filter((c) => c.status === "pending").length;



  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const h = { "x-admin-id": user.id };
      const [s, p, o, d, c] = await Promise.all([
        fetch("/api/admin/stats", { headers: h }),
        fetch("/api/admin/products", { headers: h }),
        fetch("/api/admin/orders", { headers: h }),
        fetch("/api/admin/deposits", { headers: h }),
        fetch("/api/admin/card-deposits", { headers: h }),
      ]);
      if (s.ok) setStats(await s.json());
      if (p.ok) setProducts(await p.json());
      if (o.ok) setOrders(await o.json());
      if (d.ok) setDeposits(await d.json());
      if (c.ok) setCards(await c.json());

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

  // ---- Duyệt / từ chối lệnh nạp ----
  async function reviewDeposit(id: string, action: "approve" | "reject", amount?: number) {
    if (!headers) return;
    const res = await fetch("/api/admin/deposits", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, amount }),
    });
    if (res.ok) {
      flash(action === "approve" ? "Đã cộng tiền ✔" : "Đã từ chối");
      loadAll();
    } else {
      const e = await res.json().catch(() => ({}));
      flash(e.error || "Thao tác thất bại");
    }
  }

  // ---- Duyệt / từ chối thẻ cào ----
  async function reviewCard(id: string, action: "approve" | "reject", amount?: number) {
    if (!headers) return;
    const res = await fetch("/api/admin/card-deposits", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, amount }),
    });
    if (res.ok) {
      flash(action === "approve" ? "Đã cộng tiền ✔" : "Đã từ chối");
      loadAll();
    } else {
      const e = await res.json().catch(() => ({}));
      flash(e.error || "Thao tác thất bại");
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
        <button className={tab === "deposits" ? "on" : ""} onClick={() => setTab("deposits")}>
          💳 Duyệt nạp {pendingDeposits ? `(${pendingDeposits})` : ""}
        </button>
        <button className={tab === "cards" ? "on" : ""} onClick={() => setTab("cards")}>
          🎴 Duyệt thẻ {pendingCards ? `(${pendingCards})` : ""}
        </button>
        <button className={tab === "topup" ? "on" : ""} onClick={() => setTab("topup")}>
          💵 Cộng tay
        </button>

      </div>


      {loading ? (
        <div className="admin-empty">Đang tải…</div>
      ) : tab === "overview" ? (
        <OverviewTab stats={stats} />
      ) : tab === "products" ? (
        <ProductsTab products={products} onSave={saveProduct} />
      ) : tab === "orders" ? (
        <OrdersTab orders={orders} onStatus={setOrderStatus} />
      ) : tab === "deposits" ? (
        <DepositsTab deposits={deposits} onReview={reviewDeposit} />
      ) : tab === "cards" ? (
        <CardsTab cards={cards} onReview={reviewCard} />
      ) : (
        <TopupTab headers={headers} onDone={loadAll} />
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

// ============ TAB: DUYỆT NẠP (CHUYỂN KHOẢN) ============
const DST: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "st-pending" },
  completed: { label: "Đã cộng", cls: "st-ok" },
  expired: { label: "Từ chối", cls: "st-cancel" },
};

function DepositsTab({
  deposits,
  onReview,
}: {
  deposits: AdminDeposit[];
  onReview: (id: string, action: "approve" | "reject", amount?: number) => void;
}) {
  const pending = deposits.filter((d) => d.status === "pending");
  const done = deposits.filter((d) => d.status !== "pending");

  return (
    <div className="admin-orders">
      <h3 className="ao-section">🕒 Chờ duyệt — kiểm tra CK rồi cộng tiền ({pending.length})</h3>
      {pending.length === 0 ? (
        <div className="admin-empty">Không có lệnh nạp nào chờ duyệt.</div>
      ) : (
        <div className="ao-grid">
          {pending.map((d) => (
            <DepositCard key={d.id} d={d} onReview={onReview} />
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
          {done.map((d) => (
            <DepositCard key={d.id} d={d} onReview={onReview} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepositCard({
  d,
  onReview,
}: {
  d: AdminDeposit;
  onReview: (id: string, action: "approve" | "reject", amount?: number) => void;
}) {
  const st = DST[d.status] || DST.pending;
  const shown = d.received_amount ?? d.amount ?? 0;
  // Số tiền admin xác nhận thực nhận. Mặc định lấy amount dự kiến (nếu có).
  const [confirmAmount, setConfirmAmount] = useState(String(d.amount ?? ""));
  const amountNum = Math.round(Number(confirmAmount) || 0);
  return (
    <div className={`ao-card ${d.status === "pending" ? "hot" : ""}`}>
      <div className="ao-head">
        <span className="ao-code">{d.code}</span>
        <span className={`ao-badge ${st.cls}`}>{st.label}</span>
      </div>
      <div className="ao-item">
        👤 <b>{d.customers?.username || "—"}</b>
        {d.customers?.display_name ? ` (${d.customers.display_name})` : ""}
      </div>
      <div className="ao-meta">
        <span>Nội dung CK</span>
        <span className="ao-amt">{fmtVnd(shown)}</span>
      </div>
      <div className="ao-date">{fmtDate(d.created_at)}</div>
      {d.status === "pending" && (
        <label className="ape-field" style={{ marginTop: 8 }}>
          <span>Số tiền thực nhận (VND)</span>
          <input
            type="number"
            min={0}
            value={confirmAmount}
            onChange={(e) => setConfirmAmount(e.target.value)}
            placeholder="vd 50000"
          />
        </label>
      )}
      <div className="ao-actions">
        {d.status === "pending" && (
          <>
            <button
              className="ao-done"
              disabled={amountNum <= 0}
              onClick={() => onReview(d.id, "approve", amountNum)}
            >
              ✔ Đã nhận tiền – cộng ví
            </button>
            <button className="ao-cancel" onClick={() => onReview(d.id, "reject")}>
              ✕ Từ chối
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============ TAB: DUYỆT THẺ CÀO ============
const CST: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ duyệt", cls: "st-pending" },
  completed: { label: "Đã cộng", cls: "st-ok" },
  rejected: { label: "Từ chối", cls: "st-cancel" },
};

function CardsTab({
  cards,
  onReview,
}: {
  cards: AdminCardDeposit[];
  onReview: (id: string, action: "approve" | "reject", amount?: number) => void;
}) {
  const pending = cards.filter((c) => c.status === "pending");
  const done = cards.filter((c) => c.status !== "pending");

  return (
    <div className="admin-orders">
      <h3 className="ao-section">🕒 Chờ duyệt — kiểm tra thẻ rồi cộng tiền ({pending.length})</h3>
      {pending.length === 0 ? (
        <div className="admin-empty">Không có thẻ nào chờ duyệt.</div>
      ) : (
        <div className="ao-grid">
          {pending.map((c) => (
            <CardDepositCard key={c.id} c={c} onReview={onReview} />
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
          {done.map((c) => (
            <CardDepositCard key={c.id} c={c} onReview={onReview} />
          ))}
        </div>
      )}
    </div>
  );
}

function CardDepositCard({
  c,
  onReview,
}: {
  c: AdminCardDeposit;
  onReview: (id: string, action: "approve" | "reject", amount?: number) => void;
}) {
  const st = CST[c.status] || CST.pending;
  const shown = c.received_amount ?? c.amount ?? 0;
  const [confirmAmount, setConfirmAmount] = useState(String(c.amount ?? ""));
  const amountNum = Math.round(Number(confirmAmount) || 0);
  return (
    <div className={`ao-card ${c.status === "pending" ? "hot" : ""}`}>
      <div className="ao-head">
        <span className="ao-code">{c.telco}</span>
        <span className={`ao-badge ${st.cls}`}>{st.label}</span>
      </div>
      <div className="ao-item">
        👤 <b>{c.customers?.username || "—"}</b>
        {c.customers?.display_name ? ` (${c.customers.display_name})` : ""}
      </div>
      <div className="ao-meta">
        <span>Mệnh giá khai báo</span>
        <span className="ao-amt">{fmtVnd(shown)}</span>
      </div>
      <div className="dep-info" style={{ marginTop: 8 }}>
        <div className="row"><span>Mã thẻ</span><b>{c.card_code}</b></div>
        <div className="row"><span>Serial</span><b>{c.card_serial}</b></div>
      </div>
      <div className="ao-date">{fmtDate(c.created_at)}</div>
      {c.status === "pending" && (
        <label className="ape-field" style={{ marginTop: 8 }}>
          <span>Số tiền cộng ví (VND)</span>
          <input
            type="number"
            min={0}
            value={confirmAmount}
            onChange={(e) => setConfirmAmount(e.target.value)}
            placeholder="vd 50000"
          />
        </label>
      )}
      <div className="ao-actions">
        {c.status === "pending" && (
          <>
            <button
              className="ao-done"
              disabled={amountNum <= 0}
              onClick={() => onReview(c.id, "approve", amountNum)}
            >
              ✔ Thẻ hợp lệ – cộng ví
            </button>
            <button className="ao-cancel" onClick={() => onReview(c.id, "reject")}>
              ✕ Từ chối
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============ TAB: NẠP TIỀN (CỘNG TIỀN THỦ CÔNG) ============


type TopupResult = {
  username: string;
  display_name: string | null;
  balance: number;
  added: number;
};

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

function TopupTab({
  headers,
  onDone,
}: {
  headers: { "x-admin-id": string } | undefined;
  onDone: () => void;
}) {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TopupResult | null>(null);

  const amountNum = Math.round(Number(amount) || 0);
  const canSubmit = !!username.trim() && amountNum !== 0 && !busy;

  async function submit() {
    if (!headers || !canSubmit) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), amount: amountNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Cộng tiền thất bại");
      } else {
        setResult(data as TopupResult);
        setAmount("");
        onDone();
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-topup">
      <div className="topup-card">
        <h3 className="topup-title">💵 Cộng tiền cho tài khoản</h3>
        <p className="topup-sub">
          Nhập tên đăng nhập của khách đã có tài khoản, rồi cộng tiền vào ví để test mua hàng.
          Có thể nhập số âm để trừ tiền.
        </p>

        <label className="topup-field">
          <span>Tên đăng nhập</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="vd nguyenvana"
            autoComplete="off"
          />
        </label>

        <label className="topup-field">
          <span>Số tiền (VND)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="vd 50000"
          />
        </label>

        <div className="topup-quick">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              className="tq-btn"
              onClick={() => setAmount(String(a))}
            >
              +{fmtVnd(a)}
            </button>
          ))}
        </div>

        <div className="topup-preview">
          Cộng: <b>{amountNum ? fmtVnd(amountNum) : "—"}</b>
        </div>

        <button className="topup-submit" disabled={!canSubmit} onClick={submit}>
          {busy ? "Đang xử lý…" : "Cộng tiền"}
        </button>

        {error && <div className="topup-error">⚠ {error}</div>}
        {result && (
          <div className="topup-ok">
            ✔ Đã cộng {fmtVnd(result.added)} cho <b>{result.username}</b>
            {result.display_name ? ` (${result.display_name})` : ""}. Số dư mới:{" "}
            <b>{fmtVnd(result.balance)}</b>
          </div>
        )}
      </div>
    </div>
  );
}
