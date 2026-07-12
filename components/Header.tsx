"use client";

import { useEffect, useState } from "react";
import { FALLBACK_CONTACT, fetchContact } from "@/lib/products";

export default function Header() {
  const [contact, setContact] = useState(FALLBACK_CONTACT);

  useEffect(() => {
    fetchContact().then(setContact);
  }, []);

  return (
    <>
      <div className="topstrip">
        <div className="wrap">
          <div className="seg">
            <a href="#">Chính sách</a>
            <a href="#">FAQ</a>
            <a href="#lienhe">Liên hệ</a>
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
          <div className="logo">
            <span className="mark">🌱</span>
            <span>
              GAG<span className="g">2</span> Shop
            </span>
          </div>
          <div className="menu">
            <a className="active" href="#">Trang chủ</a>
            <a href="#products">Sản phẩm</a>
            <a href="#">Nạp tiền</a>
            <a href="#">Lịch sử</a>
            <a href="#huongdan">Tài liệu</a>
          </div>
          <div className="right">
            <div className="icon-btn" title="Yêu thích">
              ♥<span className="cnt">3</span>
            </div>
            <div className="icon-btn" title="Giỏ hàng">
              🛒<span className="cnt">0</span>
            </div>
            <button className="login">Đăng nhập</button>
          </div>
        </div>
      </nav>

      <div className="wrap">
        <div className="banner">
          <div className="jp">犬夜叉</div>
          <div className="htxt">
            <h1>
              CÀY THUÊ <span className="g">GAG2</span>
            </h1>
            <p className="sub">
              Shop item / seed / gear game Grow A Garden 2 — giao dịch nhanh, uy
              tín, an toàn tuyệt đối.
            </p>
            <div className="tags">
              <span>🐾 UY TÍN</span>
              <span>🐾 NHANH CHÓNG</span>
              <span>🐾 GIÁ RẺ</span>
              <span>🐾 CHẤT LƯỢNG</span>
            </div>
          </div>
          <div className="promo">
            <div className="gift">🎁</div>
            <div className="n">1</div>
            <div className="txt">
              BUY TRÊN <b>50K</b>
              <br />
              TẶNG AE
              <br />
              <b>MOON BLOOM</b>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}