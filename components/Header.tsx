"use client";

import { useEffect, useState } from "react";
import { FALLBACK_CONTACT, fetchContact } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";

export type Tab = "home" | "products" | "deposit" | "history" | "admin";

const MENU: { key: Tab; label: string }[] = [
  { key: "home", label: "Trang chủ" },
  { key: "products", label: "Sản phẩm" },
  { key: "deposit", label: "Nạp tiền" },
  { key: "history", label: "Lịch sử" },
];



export default function Header({
  active,
  onNav,
}: {
  active: Tab;
  onNav: (tab: Tab) => void;
}) {
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const { user, logout, refreshBalance } = useAuth();

  useEffect(() => {
    fetchContact().then(setContact);
    refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="topstrip">
        <div className="wrap">
          <div className="seg">
            <a href="#">Chính sách</a>
            <a href="#">FAQ</a>
            <a href="#lienhe">Liên hệ ({contact.handle})</a>
          </div>
          <div className="seg">
            <span className="pill on">VI</span>
            <span className="pill">EN</span>
            <span className="pill">TH</span>
            <span className="pill">CN</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span className="pill on">VND</span>
            <span className="pill">USD</span>
          </div>
        </div>
      </div>

      <nav className="nav">
        <div className="wrap">
          <div className="logo" onClick={() => onNav("home")} style={{ cursor: "pointer" }}>
            <span className="mark">🛒</span>
            <span>
              <span className="g">shopsohaynho2</span>
            </span>
          </div>
          <div className="menu">
            {MENU.map((m) => (
              <a
                key={m.key}
                className={active === m.key ? "active" : ""}
                onClick={() => onNav(m.key)}
                style={{ cursor: "pointer" }}
              >
                {m.label}
              </a>
            ))}
            {user?.is_admin && (
              <a
                className={active === "admin" ? "active admin-link" : "admin-link"}
                onClick={() => onNav("admin")}
                style={{ cursor: "pointer" }}
              >
                🛠️ Quản lý
              </a>
            )}
          </div>

          <div className="right">
            <div className="icon-btn" title="Yêu thích">
              ♥<span className="cnt">3</span>
            </div>
            <div className="icon-btn" title="Giỏ hàng">
              🛒<span className="cnt">0</span>
            </div>
            <span className="user-hi">
              👋 {user?.display_name || user?.username}
            </span>
            <span className="balance">
              💳 {(user?.balance || 0).toLocaleString("vi-VN")}đ
            </span>
            <button className="deposit-btn" onClick={() => onNav("deposit")}>
              + Nạp tiền
            </button>
            <button className="login" onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </nav>
    </>
  );
}

