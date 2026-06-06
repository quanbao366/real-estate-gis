"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function isValidEmail(email) {
  // Basic email regex for client-side validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      String(email).trim().length > 0 &&
      isValidEmail(email) &&
      String(password).length >= 6
    );
  }, [email, password]);

  useEffect(() => {
    // If already logged in, go home
    const token = localStorage.getItem("token");
    if (token) router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!String(email).trim()) return setError("Vui lòng nhập email.");
    if (!isValidEmail(email)) return setError("Email không hợp lệ.");
    if (!String(password)) return setError("Vui lòng nhập mật khẩu.");
    if (String(password).length < 6)
      return setError("Mật khẩu phải có ít nhất 6 ký tự.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return setError(data?.error || "Đăng nhập thất bại");
      }

      const token = data?.token;
      const user = data?.user;

      if (!token || !user) return setError("Dữ liệu đăng nhập không hợp lệ.");

      localStorage.setItem("token", token);

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold">
            GIS
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">Đăng nhập</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sử dụng tài khoản để trải nghiệm bản đồ bất động sản.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-3xl shadow-sm p-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <input
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: abc@gmail.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Mật khẩu</label>
              <input
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="text-sm text-red-600 font-semibold" role="alert">
                {error}
              </div>
            ) : null}

            <button
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
              type="submit"
              disabled={!canSubmit || loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                className="text-indigo-700 font-bold hover:underline"
                onClick={() => router.push("/register")}
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
