"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function Navbar({ radiusKm, setRadiusKm }) {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);

  const syncFromToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserName("");
      return;
    }

    // Optimistic: decode payload để hiển thị nhanh
    const payload = decodeJwtPayload(token);
    const decodedName =
      payload?.full_name || payload?.fullName || payload?.user?.full_name;
    if (decodedName) setUserName(String(decodedName));

    // Optionally refresh from backend (prepared for future extensions)
    setLoadingUser(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.user?.full_name) {
        setUserName(String(data.user.full_name));
      }
      if (!res.ok) {
        localStorage.removeItem("token");
        setUserName("");
      }
    } catch {
      // keep decoded name if any
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    syncFromToken();
  }, [syncFromToken]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setUserName("");
    router.push("/");
  }, [router]);

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold">
            GIS
          </div>
          <div>
            <h1 className="text-lg font-extrabold">BĐS GIS DATN</h1>
            <p className="text-xs text-gray-500">
              PostGIS + PostgreSQL + Leaflet
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 text-sm">
          <a
            className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium"
            href="#map"
          >
            Bản đồ
          </a>
          <a
            className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium"
            href="#list"
          >
            Danh sách
          </a>
          <a
            className="px-3 py-2 rounded-lg hover:bg-gray-100 font-medium"
            href="#filter"
          >
            Bộ lọc
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {userName ? (
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                {loadingUser ? "Đang tải..." : userName}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 transition"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition"
              >
                Đăng ký
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 hidden sm:block">
              Bán kính (km)
            </label>
            <input
              className="w-28 border rounded-lg px-3 py-2 text-sm"
              type="number"
              min={1}
              max={200}
              value={radiusKm}
              onChange={(e) =>
                setRadiusKm(e.target.value ? Number(e.target.value) : 10)
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
