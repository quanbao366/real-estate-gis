import React from "react";

export default function Navbar({ radiusKm, setRadiusKm }) {
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
    </header>
  );
}
