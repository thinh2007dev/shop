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

const PRESETS = [20000, 50000, 100000, 200000, 500000, 1000000];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function DepositPanel() {
  const { user, refreshBalance } = useAuth();
  const [amount, setAmount] = useState<number>(50000);
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notified, setNotified] = useState(false);
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
    setNotified(false);
    setError("");
  }


  return (
    <div className="panel">
      <div className="panel-head">
        <h2>💰 Nạp tiền vào tài khoản</h2>
        <p>Quét QR chuyển khoản, sau đó bấm &quot;Tôi đã chuyển khoản&quot; — admin duyệt và cộng tiền vào ví.</p>

      </div>

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
              Tối thiểu <b>10.000đ</b>. Sau khi chuyển khoản, bấm xác nhận để admin duyệt.
            </p>

          </>
        ) : (
          <>
            <div className="mhead">
              <div className="ico">📲</div>
              <div>
                <h3>Quét mã để chuyển khoản</h3>
                <div className="rar">Chuyển xong bấm xác nhận để admin duyệt</div>
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

            {notified ? (
              <div className="dep-wait">
                <span className="spin" /> Đã báo admin. Đang chờ duyệt… (tự động cập nhật khi tiền vào ví)
              </div>
            ) : (
              <button className="cbtn" onClick={() => setNotified(true)}>
                ✓ Tôi đã chuyển khoản
              </button>
            )}
            <p className="hint">
              Nhập <b>đúng nội dung CK</b> ở trên. Quét QR sẽ tự điền sẵn. Tiền vào ví sau khi admin duyệt.
            </p>
            <button className="dep-cancel" onClick={reset}>Huỷ / tạo mã khác</button>

          </>
        )}
      </div>
    </div>
  );
}
