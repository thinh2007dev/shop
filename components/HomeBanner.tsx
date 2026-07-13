"use client";

import type { Tab } from "./Header";

type Game = {
  key: string;
  name: string;
  emoji: string;
  tag: string;
  available: boolean;
};

const GAMES: Game[] = [
  { key: "gag", name: "Grow A Garden 2", emoji: "🌱", tag: "Đang bán", available: true },
  { key: "bloxfruits", name: "Blox Fruits", emoji: "🍇", tag: "Sắp có", available: false },
  { key: "petsim", name: "Pet Simulator 99", emoji: "🐾", tag: "Sắp có", available: false },
  { key: "adoptme", name: "Adopt Me!", emoji: "🏠", tag: "Sắp có", available: false },
];

export default function HomeBanner({ onNav }: { onNav: (t: Tab) => void }) {
  return (
    <div className="wrap">
      <div className="home-banner">
        <div className="home-banner-art">
          <div className="hb-title">
            🌱 <span>shopsohaynho2</span>
          </div>
          <div className="hb-sub">Grow A Garden 2 — Seed · Gear · Item hiếm</div>
        </div>
      </div>

      <section className="game-select">
        <div className="gs-head">
          <h2>
            Chọn <span>game</span>
          </h2>
          <p>Chọn tựa game bạn muốn mua vật phẩm</p>
        </div>
        <div className="games">
          {GAMES.map((g) => (
            <button
              key={g.key}
              className={`game-card${g.available ? "" : " soon"}`}
              onClick={() => g.available && onNav("products")}
              disabled={!g.available}
              title={g.available ? `Mua ${g.name}` : "Sắp ra mắt"}
            >
              <span className="game-emoji">{g.emoji}</span>
              <span className="game-name">{g.name}</span>
              <span className={`game-tag${g.available ? " on" : ""}`}>{g.tag}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
