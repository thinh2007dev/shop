"use client";

import { useEffect } from "react";

export default function AutoSyncDeposits() {
  useEffect(() => {
    // Silent sync khi app load - không hiện thông báo
    fetch("/api/cron/sync-deposits", { cache: "no-store" }).catch(() => {});
  }, []);

  return null;
}
