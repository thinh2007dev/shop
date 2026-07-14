import { NextResponse } from "next/server";
import { syncDeposits, bytemartConfigured } from "@/lib/bytemart";

export const dynamic = "force-dynamic";

// Cron: Vercel gọi định kỳ để quét giao dịch bank -> cộng tiền tự động.
// Bảo vệ bằng CRON_SECRET (Vercel gửi header Authorization: Bearer <CRON_SECRET>).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!bytemartConfigured()) {
    return NextResponse.json({ error: "BYTEMART_TOKEN chưa cấu hình" }, { status: 503 });
  }

  const completed = await syncDeposits();
  return NextResponse.json({ ok: true, completed });
}
