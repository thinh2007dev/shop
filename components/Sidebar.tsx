export type CatKey = "all" | "Seed" | "Gear" | "Pet";

const CATS: { ico: string; name: string; key: CatKey; cnt: number }[] = [
  { ico: "📦", name: "Tất cả sản phẩm", key: "all", cnt: 14 },
  { ico: "🌱", name: "Seed / Hạt giống", key: "Seed", cnt: 7 },
  { ico: "🔧", name: "Gear / Dụng cụ", key: "Gear", cnt: 2 },
  { ico: "🐶", name: "Pet / Thú cưng", key: "Pet", cnt: 5 },
];

export default function Sidebar({
  active = "all",
  onSelect,
}: {
  active?: CatKey;
  onSelect?: (key: CatKey) => void;
}) {
  return (
    <aside className="side">
      <h3>Danh mục</h3>
      <ul>
        {CATS.map((c) => (
          <li key={c.key}>
            <a
              className={active === c.key ? "active" : ""}
              href="#products"
              onClick={(e) => {
                e.preventDefault();
                onSelect?.(c.key);
              }}
            >
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
