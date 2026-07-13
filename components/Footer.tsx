"use client";

import { useEffect, useState } from "react";
import { FALLBACK_CONTACT, fetchContact } from "@/lib/products";

export default function Footer() {
  const [contact, setContact] = useState(FALLBACK_CONTACT);

  useEffect(() => {
    fetchContact().then(setContact);
  }, []);

  return (
    <footer id="lienhe">
      <div className="wrap">
        <div className="cols">
          <div>
            <h4>shopsohaynho2 - {contact.handle}</h4>
            <p>
              Shop chuyên cung cấp item, seed, gear game Grow A Garden 2 giá rẻ,
              uy tín, giao dịch nhanh chóng, an toàn tuyệt đối.
            </p>
            <p>Cảm ơn AE đã tin tưởng — Chất lượng làm nên thương hiệu! 🐾</p>
          </div>
          <div id="huongdan">
            <h4>Hướng dẫn</h4>
            <ul>
              <li>
                <a href="#">Cách đặt hàng</a>
              </li>
              <li>
                <a href="#">Nạp BANK / CARD</a>
              </li>
              <li>
                <a href="#">Chính sách bảo hành</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul>
              <li>📱 Zalo: {contact.handle}</li>
              <li>💬 Facebook: {contact.handle}</li>
              <li>⏰ {contact.hours}</li>
            </ul>
          </div>
        </div>
        <div className="copy">
          © 2025 {contact.handle} — shopsohaynho2. Uy tín tạo nên thương hiệu.
        </div>
      </div>
    </footer>
  );
}