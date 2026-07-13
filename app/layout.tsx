import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "shopsohaynho2 | Shop Grow A Garden 2",
  description:
    "Shop chuyên cung cấp item, seed, gear game Grow A Garden 2 giá rẻ, uy tín, giao dịch nhanh chóng, an toàn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
