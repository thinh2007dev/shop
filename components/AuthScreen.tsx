"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password, displayName);
      }
      // Thành công: AuthProvider set user -> AuthGate tự render shop
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setPassword("");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="mark">🌱</span>
          <span>
            GAG<span className="g">2</span> Shop
          </span>
        </div>
        <p className="auth-sub">
          {mode === "login"
            ? "Đăng nhập để mua item Grow A Garden 2"
            : "Tạo tài khoản mới để bắt đầu mua sắm"}
        </p>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "on" : ""}
            onClick={() => switchMode("login")}
            type="button"
          >
            Đăng nhập
          </button>
          <button
            className={mode === "register" ? "on" : ""}
            onClick={() => switchMode("register")}
            type="button"
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Tên đăng nhập
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="vd: sohaynho01"
              autoComplete="username"
              required
            />
          </label>

          {mode === "register" && (
            <label>
              Tên hiển thị (tuỳ chọn)
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="vd: Sơ Hay Nhỏ"
                autoComplete="nickname"
              />
            </label>
          )}

          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Tối thiểu 6 ký tự" : "••••••••"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button type="button" onClick={() => switchMode("register")}>
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button type="button" onClick={() => switchMode("login")}>
                Đăng nhập
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
