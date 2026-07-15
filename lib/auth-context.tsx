"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

export type User = {
  id: string;
  username: string;
  display_name: string | null;
  balance?: number;
  is_admin?: boolean;
};


type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
};

const STORAGE_KEY = "gag2_user";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  // Realtime subscription - tự động cập nhật số dư khi thay đổi
  useEffect(() => {
    if (!user) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel(`balance:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "customers",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as { balance?: number; is_admin?: boolean };
          if (updated.balance !== undefined) {
            setUser((prev) => {
              if (!prev) return prev;
              const next = { ...prev, balance: updated.balance, is_admin: updated.is_admin ?? prev.is_admin };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  function persist(u: User) {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }

  async function login(username: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại");
    persist(data);
  }

  async function register(username: string, password: string, displayName?: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
    persist(data);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function refreshBalance() {
    if (!user) return;
    try {
      const res = await fetch(`/api/me?id=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      persist({ ...user, balance: data.balance, is_admin: data.is_admin ?? user.is_admin });
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng trong AuthProvider");
  return ctx;
}
