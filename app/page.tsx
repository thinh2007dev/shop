"use client";

import { useState } from "react";
import Header, { Tab } from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Catalog from "@/components/Catalog";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import AuthGate from "@/components/AuthGate";
import HomeBanner from "@/components/HomeBanner";
import DepositPanel from "@/components/DepositPanel";
import HistoryPanel from "@/components/HistoryPanel";
import AdminPanel from "@/components/AdminPanel";
import { useAuth } from "@/lib/auth-context";

function HomeView() {
  return (
    <div className="wrap">
      <main>
        <div className="prod-head">
          <h2>
            Sản phẩm <span>nổi bật</span>
          </h2>
          <div className="legend">
            <span><i style={{ background: "#5eb3ff" }} />Hiếm</span>
            <span><i style={{ background: "#b57bff" }} />Sử thi</span>
            <span><i style={{ background: "#ffb020" }} />Huyền thoại</span>
          </div>
        </div>
        <ProductGrid featured />
        <Trust />
      </main>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const { user } = useAuth();

  return (
    <AuthGate>
      <Header active={tab} onNav={setTab} />


      {tab === "home" && (
        <>
          <HomeBanner onNav={setTab} />
          <HomeView />
        </>
      )}

      {tab === "products" && (
        <div className="wrap">
          <Catalog />
        </div>
      )}


      {tab === "deposit" && (
        <div className="wrap">
          <DepositPanel />
        </div>
      )}

      {tab === "history" && (
        <div className="wrap">
          <HistoryPanel />
        </div>
      )}

      {tab === "admin" && user?.is_admin && (
        <div className="wrap">
          <AdminPanel />
        </div>
      )}

      <Footer />

    </AuthGate>
  );
}
