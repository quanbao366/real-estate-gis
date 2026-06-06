"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      String(fullName).trim().length > 1 &&
      isValidEmail(email) &&
      String(password).length >= 6 &&
      password === confirmPassword
    );
  }, [fullName, email, password, confirmPassword]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!String(fullName).trim()) return setError("Vui lòng nhập họ tên.");
    if (String(fullName).trim().length < 2)
      return setError("Họ tên phải có ít nhất 2 ký tự.");
    if (!String(email).trim()) return setError("Vui lòng nhập email.");
    if (!isValidEmail(email)) return setError("Email không hợp lệ.");
    if (!String(password)) return setError("Vui lòng nhập mật khẩu.");
    if (String(password).length < 6)
      return setError("Mật khẩu phải có ít nhất 6 ký tự.");
    if (password !== confirmPassword)
      return setError("Xác nhận mật khẩu không khớp.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return setError(data?.error || "Đăng ký thất bại");
      }

      router.push("/login");
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
          <h2 className="mt-3 text-2xl font-extrabold">Đăng ký</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tạo tài khoản để đăng nhập vào hệ thống.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-3xl shadow-sm p-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Họ tên</label>
              <input
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="vd: Nguyễn Văn A"
                autoComplete="name"
              />
            </div>

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
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
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
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <button
                type="button"
                className="text-indigo-700 font-bold hover:underline"
                onClick={() => router.push("/login")}
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
