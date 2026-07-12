import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ProductGrid from "@/components/ProductGrid";
import Trust from "@/components/Trust";
import RecentFeed from "@/components/RecentFeed";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />

      <div className="wrap">
        <div className="grid-main">
          <Sidebar />

          <main>
            <div className="prod-head">
              <h2>
                Shop <span>Grow A Garden 2</span> — Item
              </h2>
              <div className="legend">
                <span><i style={{ background: "#5eb3ff" }} />Hiếm</span>
                <span><i style={{ background: "#b57bff" }} />Sử thi</span>
                <span><i style={{ background: "#ffb020" }} />Huyền thoại</span>
              </div>
            </div>

            <ProductGrid />
            <Trust />
          </main>

          <RecentFeed />
        </div>
      </div>

      <Footer />
    </>
  );
}
