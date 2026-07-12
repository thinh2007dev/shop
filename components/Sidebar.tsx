const CATS = [
  { ico: "📦", name: "Tất cả sản phẩm", cnt: 6, active: true },
  { ico: "🌱", name: "Seed / Hạt giống", cnt: 2 },
  { ico: "🔧", name: "Gear / Dụng cụ", cnt: 2 },
  { ico: "💎", name: "Item hiếm", cnt: 2 },
];

export default function Sidebar() {
  return (
    <aside className="side">
      <h3>Danh mục</h3>
      <ul>
        {CATS.map((c) => (
          <li key={c.name}>
            <a className={c.active ? "active" : ""} href="#products">
              <span className="ico">{c.ico}</span>
              {c.name}
              <span className="cnt">{c.cnt}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="note">
        <b>LƯU Ý:</b> Nhớ quay video trước khi check nhé! Có thời gian check với
        ngày tháng năm.
        <br />
        <br />
        <b>UY TÍN – AN TOÀN</b> · Không ban – Không rủi ro ✅
      </div>
    </aside>
  );
}
