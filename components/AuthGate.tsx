"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthScreen from "./AuthScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-wrap">
        <div className="auth-loading">Đang tải…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <>{children}</>;
}
