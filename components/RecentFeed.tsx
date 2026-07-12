"use client";

import { useEffect, useState, useCallback } from "react";
import { FALLBACK_PRODUCTS } from "@/lib/products";

const NAMES = ["mi**", "tu**", "kh**", "li**", "ho**", "ba**", "du**", "ph**", "na**", "vi**"];
const AGO = ["vừa xong", "1 phút trước", "3 phút trước", "8 phút trước", "15 phút trước", "1 giờ trước"];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeOrder(id: number) {
  const p = pick(FALLBACK_PRODUCTS);
  const q = 1 + Math.floor(Math.random() * 3);
  return { id, name: pick(NAMES), rest: `mua ${q} × ${p.name}`, amt: p.price_bank, ago: pick(AGO) };
}

function makeDeposit(id: number) {
  const amt = pick(["50.000đ", "100.000đ", "200.000đ", "20.000đ", "500.000đ"]);
  return { id, name: pick(NAMES), rest: "nạp tiền thành công", amt, ago: pick(AGO) };
}

function useLiveFeed(factory: (id: number) => ReturnType<typeof makeOrder>, ms: number) {
  const stableFactory = useCallback(factory, []);
  const [rows, setRows] = useState<ReturnType<typeof makeOrder>[]>([]);
  useEffect(() => {
    let c = 0;
    setRows(Array.from({ length: 5 }, () => stableFactory(c++)));
    const t = setInterval(() => setRows((prev) => [stableFactory(c++), ...prev].slice(0, 6)), ms);
    return () => clearInterval(t);
  }, [stableFactory, ms]);
  return rows;
}

export default function RecentFeed() {
  const orders = useLiveFeed(makeOrder, 4000);
  const deposits = useLiveFeed(makeDeposit, 6500);

  return (
    <div className="rail">
      <div className="feed">
        <h3><span className="dot" />Đơn hàng gần đây</h3>
        {orders.map((r) => (
          <div className="row" key={r.id}>
            <span className="l1">
              <b>{r.name}</b> {r.rest}
            </span>
            <span className="l2">
              <span className="amt">{r.amt}</span>
              <span>{r.ago}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="feed">
        <h3><span className="dot" />Nạp tiền gần đây</h3>
        {deposits.map((r) => (
          <div className="row" key={r.id}>
            <span className="l1">
              <b>{r.name}</b> {r.rest}
            </span>
            <span className="l2">
              <span className="amt">{r.amt}</span>
              <span>{r.ago}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}