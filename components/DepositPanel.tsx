"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

type Deposit = {
  id: string;
  code: string;
  amount: number | null;
  status: "pending" | "completed" | "expired";
  qr_url: string;
  bank: string;
  account: string;
  account_name: string;
};

type CardDeposit = {
  id: string;
  telco: string;
  amount: number | null;
  status: "pending" | "completed" | "rejected";
};

const PRESETS = [20000, 50000, 100000, 200000, 500000, 1000000];
const TELCOS = ["Viettel", "Mobifone", "Vinaphone", "Vietnamobile", "Zing", "Garena", "Gate"];

// Bảng chiết khấu theo mệnh giá (%)
const CARD_RATES: Record<number, number> = {
  10000: 0.147,  // 14.7%
  20000: 0.147,  // 14.7%
  30000: 0.147,  // 14.7%
  50000: 0.109,  // 10.9%
  100000: 0.123, // 12.3%
  200000: 0.123, // 12.3%
  300000: 0.123, // 12.3%
  500000: 0.123, // 12.3%
  1000000: 0.123, // 12.3%
};

function getDiscountRate(amount: number): number {
  return CARD_RATES[amount] ?? 0.25;
}

function calcFinal(amount: number): number {
  return Math.floor(amount * (1 - getDiscountRate(amount)));
}

const CARD_AMOUNTS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function DepositPanel() {
  const { user, refreshBalance } = useAuth();
  const [method, setMethod] = useState<"bank" | "card">("bank");

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>💰 Nạp tiền vào tài khoản</h2>
        <p>Chọn hình thức nạp: chuyển khoản ngân hàng hoặc gửi thẻ cào — admin duyệt và cộng tiền vào ví.</p>
      </div>

      <div className="dep-method">
        <button
          className={method === "bank" ? "on" : ""}
          onClick={() => setMethod("bank")}
          type="button"
        >
          🏦 Chuyển khoản
        </button>
        <button
          className={method === "card" ? "on" : ""}
          onClick={() => setMethod("card")}
          type="button"
        >
          💳 Nạp thẻ cào
        </button>
      </div>

      {method === "bank" ? (
        <BankDeposit user={user} refreshBalance={refreshBalance} />
      ) : (
        <CardDepositForm user={user} refreshBalance={refreshBalance} />
      )}
    </div>
  );
}

// ============ CHUYỂN KHOẢN NGÂN HÀNG ============
function BankDeposit({
  user,
  refreshBalance,
}: {
  user: ReturnType<typeof useAuth>["user"];
  refreshBalance: ReturnType<typeof useAuth>["refreshBalance"];
}) {
  const [amount, setAmount] = useState<number>(50000);
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!deposit || done) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposits?id=${deposit.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed") {
          setDone(true);
          await refreshBalance();
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [deposit, done, refreshBalance]);

  async function createDeposit() {
    if (!user) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: user.id, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được lệnh nạp");
      setDeposit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setDeposit(null);
    setDone(false);
    setError("");
  }

  return (
    <div className="panel-card">
      {done ? (
        <div className="dep-done">
          <div className="dep-check">✓</div>
          <h3>Nạp tiền thành công!</h3>
          <p>Đã cộng {deposit && fmt(deposit.amount || 0)} vào tài khoản.</p>
          <button className="cbtn" onClick={reset}>Nạp tiếp</button>
        </div>
      ) : !deposit ? (
        <>
          <div className="dep-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={amount === p ? "on" : ""}
                onClick={() => setAmount(p)}
                type="button"
              >
                {fmt(p)}
              </button>
            ))}
          </div>

          <div className="qty">
            <label>Số tiền</label>
            <input
              type="number"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="cbtn" onClick={createDeposit} disabled={busy}>
            {busy ? "Đang tạo..." : "Tạo mã nạp"}
          </button>
          <p className="hint">
            Tối thiểu <b>10.000đ</b>. Sau khi chuyển khoản đúng nội dung, tiền tự động vào ví trong 1-2 phút.
          </p>
        </>
      ) : (
        <>
          <div className="mhead">
            <div className="ico">📲</div>
            <div>
              <h3>Quét mã để chuyển khoản</h3>
              <div className="rar">Tiền tự động vào ví sau 1-2 phút</div>
            </div>
          </div>

          <div className="dep-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deposit.qr_url}
              alt="QR chuyển khoản"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                setError("Không tải được mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.");
              }}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}

          <div className="dep-info">
            <div className="row"><span>Ngân hàng</span><b>{deposit.bank}</b></div>
            <div className="row"><span>Số TK</span><b>{deposit.account}</b></div>
            <div className="row"><span>Chủ TK</span><b>{deposit.account_name}</b></div>
            <div className="row"><span>Số tiền</span><b>{fmt(deposit.amount || 0)}</b></div>
            <div className="row hl"><span>Nội dung CK</span><b>{deposit.code}</b></div>
          </div>

          <div className="dep-wait">
            <span className="spin" /> Tiền tự động vào ví sau 1-2 phút
          </div>
          <p className="hint">
            Nhập <b>đúng nội dung CK</b> ở trên. Quét QR sẽ tự điền sẵn. Tiền vào ví <b>tự động</b> sau 1-2 phút.
          </p>
          <button className="dep-cancel" onClick={reset}>Huỷ / tạo mã khác</button>
        </>
      )}
    </div>
  );
}

// ============ NẠP THẺ CÀO ============
function CardDepositForm({
  user,
  refreshBalance,
}: {
  user: ReturnType<typeof useAuth>["user"];
  refreshBalance: ReturnType<typeof useAuth>["refreshBalance"];
}) {
  const [telco, setTelco] = useState("Viettel");
  const [amount, setAmount] = useState<number>(50000);
  const [serial, setSerial] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<CardDeposit | null>(null);
  const [done, setDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const discountRate = getDiscountRate(amount);
  const discountPercent = Math.round(discountRate * 100);
  const finalAmount = calcFinal(amount);

  useEffect(() => {
    if (!card || done) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/card-deposits?id=${card.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed") {
          setDone(true);
          setCard(data);
          await refreshBalance();
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "rejected") {
          setError("Thẻ bị từ chối. Vui lòng kiểm tra lại thông tin thẻ và thử lại.");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [card, done, refreshBalance]);

  async function submit() {
    if (!user) return;
    if (!serial.trim() || !code.trim()) {
      setError("Vui lòng nhập đầy đủ mã thẻ và số serial");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/card-deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          telco,
          amount,
          card_serial: serial.trim(),
          card_code: code.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không gửi được thẻ");
      setCard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCard(null);
    setDone(false);
    setSerial("");
    setCode("");
    setError("");
  }

  return (
    <div className="panel-card">
      {done ? (
        <div className="dep-done">
          <div className="dep-check">✓</div>
          <h3>Nạp thẻ thành công!</h3>
          <p>Đã cộng {card && fmt(card.amount || 0)} vào tài khoản.</p>
          <button className="cbtn" onClick={reset}>Nạp tiếp</button>
        </div>
      ) : card ? (
        <>
          <div className="mhead">
            <div className="ico">💳</div>
            <div>
              <h3>Đã gửi thẻ cho admin</h3>
              <div className="rar">Đang chờ admin kiểm tra và duyệt</div>
            </div>
          </div>

          <div className="dep-info">
            <div className="row"><span>Loại thẻ</span><b>{card.telco}</b></div>
            <div className="row"><span>Mệnh giá</span><b>{fmt(card.amount || 0)}</b></div>
            <div className="row hl"><span>Trạng thái</span><b>Chờ duyệt</b></div>
          </div>

          {error ? (
            <div className="auth-error">{error}</div>
          ) : (
            <div className="dep-wait">
              <span className="spin" /> Đang chờ admin duyệt… (tự động cập nhật khi tiền vào ví)
            </div>
          )}
          <p className="hint">
            Vui lòng nhập <b>đúng mã thẻ và serial</b>. Nếu sai thẻ có thể bị từ chối hoặc cộng sai mệnh giá.
          </p>
          <button className="dep-cancel" onClick={reset}>Gửi thẻ khác</button>
        </>
      ) : (
        <>
          <div className="qty">
            <label>Loại thẻ</label>
            <select value={telco} onChange={(e) => setTelco(e.target.value)}>
              {TELCOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="dep-presets">
            {CARD_AMOUNTS.map((p) => (
              <button
                key={p}
                className={amount === p ? "on" : ""}
                onClick={() => setAmount(p)}
                type="button"
              >
                {fmt(p)}
              </button>
            ))}
          </div>

          <div className="qty">
            <label>Mệnh giá</label>
            <input
              type="number"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          {/* Hiển thị chiết khấu */}
          <div className="card-discount-preview">
            <div className="discount-row">
              <span>Mệnh giá thẻ:</span>
              <b>{fmt(amount)}</b>
            </div>
            <div className="discount-row">
              <span>Chiết khấu:</span>
              <b style={{ color: "#e53935" }}>-{discountPercent}%</b>
            </div>
            <div className="discount-row final">
              <span>Nhận được:</span>
              <b style={{ color: "#4caf50", fontSize: 18 }}>{fmt(finalAmount)}</b>
            </div>
          </div>

          <div className="qty">
            <label>Mã thẻ</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Nhập mã thẻ (số nạp)"
              autoComplete="off"
              inputMode="numeric"
            />
          </div>

          <div className="qty">
            <label>Số serial</label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Nhập số serial (ID thẻ)"
              autoComplete="off"
              inputMode="numeric"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="cbtn" onClick={submit} disabled={busy}>
            {busy ? "Đang gửi..." : "Gửi thẻ nạp"}
          </button>
          <p className="hint">
            Chọn <b>đúng loại thẻ và mệnh giá</b>. Sai thông tin có thể mất thẻ. Tiền vào ví sau khi admin duyệt.
          </p>
        </>
      )}
    </div>
  );
}
