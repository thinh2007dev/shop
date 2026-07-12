const ITEMS = [
  { ic: "🎥", h: "NHỚ QUAY VIDEO", s: "Trước khi check nhé!" },
  { ic: "⏱️", h: "CÓ THỜI GIAN CHECK", s: "Với ngày tháng năm rõ ràng" },
  { ic: "🛡️", h: "UY TÍN – AN TOÀN", s: "Không ban – Không rủi ro" },
];

export default function Trust() {
  return (
    <div className="trust">
      {ITEMS.map((t) => (
        <div className="t" key={t.h}>
          <div className="ic">{t.ic}</div>
          <div>
            <div className="h">{t.h}</div>
            <div className="s">{t.s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
