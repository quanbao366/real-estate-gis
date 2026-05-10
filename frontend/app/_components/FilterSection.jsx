"use client";

import React, { useMemo } from "react";

function formatVNDToTy(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return "";
  return `${n}`;
}

function SectionTitle({ title, desc }) {
  return (
    <div className="mb-2">
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      {desc ? <div className="text-xs text-gray-500 mt-1">{desc}</div> : null}
    </div>
  );
}

function TagButton({ active, label, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-xs font-semibold border transition whitespace-nowrap focus:outline-none ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon ? <span className="mr-1">{icon}</span> : null}
      {label}
    </button>
  );
}

export default function FilterSection({
  query,
  onChange,
  onApply,
  onReset,
  loading,
  total,
  onSliderCommit,
}) {
  const priceMin = query.priceMinSlider ?? 0;
  const priceMax = query.priceMaxSlider ?? 50;
  const areaMin = query.areaMinSlider ?? 30;
  const areaMax = query.areaMaxSlider ?? 500;

  const priceLabel = `Khoảng giá: ${priceMin} tỷ - ${priceMax} tỷ`;
  const areaLabel = `Diện tích: ${areaMin}m² - ${areaMax}m²`;

  const resultsCountText = (() => {
    if (loading) return "Hiển thị ... / ... bất động sản";
    const t = Number(total || 0);
    const shown = t > 0 ? 20 : 0;
    return `Hiển thị ${shown} / ${t} bất động sản`;
  })();

  const quickFilters = [
    {
      key: "near_center",
      label: "Gần trung tâm",
      icon: "📍",
      apply: () => ({
        q: "",
      }),
    },
  ];

  return (
    <section id="filter" className="bg-white rounded-3xl border shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold text-base">Bộ lọc</h2>
          <p className="text-xs text-gray-500 mt-1">
            Lọc nhanh theo giá, diện tích, loại & sắp xếp.
          </p>
        </div>
        <div className="hidden sm:block text-xs text-gray-500 text-right">
          {loading ? "Đang cập nhật..." : "Sẵn sàng"}
          <div className="mt-2 font-semibold text-gray-900">
            {resultsCountText}
          </div>
        </div>
      </div>

      {/* inputs */}
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Giá min (tỷ)</label>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>0</span>
                <span>{priceMin} tỷ</span>
              </div>
              <input
                id="priceMin"
                className="mt-2 w-full"
                type="range"
                min={0}
                max={50}
                step={1}
                value={priceMin}
                onChange={(e) => {
                  onChange("priceMinSlider", Number(e.target.value));
                }}
                onMouseUp={() => {
                  onSliderCommit({
                    minPrice: priceMin <= 0 ? "" : String(priceMin),
                  });
                  onApply();
                }}
                onTouchEnd={() => {
                  onSliderCommit({
                    minPrice: priceMin <= 0 ? "" : String(priceMin),
                  });
                  onApply();
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Giá max (tỷ)</label>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>{priceMin} tỷ</span>
                <span>{priceMax} tỷ</span>
              </div>
              <div className="text-[12px] font-semibold text-gray-900 mt-2">
                {priceLabel}
              </div>
              <input
                id="priceMax"
                className="mt-2 w-full"
                type="range"
                min={0}
                max={50}
                step={1}
                value={priceMax}
                onChange={(e) => {
                  onChange("priceMaxSlider", Number(e.target.value));
                }}
                onMouseUp={() => {
                  onSliderCommit({
                    maxPrice: priceMax >= 50 ? "" : String(priceMax),
                  });
                  onApply();
                }}
                onTouchEnd={() => {
                  onSliderCommit({
                    maxPrice: priceMax >= 50 ? "" : String(priceMax),
                  });
                  onApply();
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Diện tích min (m²)</label>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>30</span>
                <span>{areaMin}m²</span>
              </div>
              <input
                id="areaMin"
                className="mt-2 w-full"
                type="range"
                min={30}
                max={500}
                step={5}
                value={areaMin}
                onChange={(e) => {
                  onChange("areaMinSlider", Number(e.target.value));
                }}
                onMouseUp={() => {
                  onSliderCommit({
                    minArea: areaMin <= 30 ? "" : String(areaMin),
                  });
                  onApply();
                }}
                onTouchEnd={() => {
                  onSliderCommit({
                    minArea: areaMin <= 30 ? "" : String(areaMin),
                  });
                  onApply();
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Diện tích max (m²)</label>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>{areaMin}m²</span>
                <span>{areaMax}m²</span>
              </div>
              <input
                id="areaMax"
                className="mt-2 w-full"
                type="range"
                min={30}
                max={500}
                step={5}
                value={areaMax}
                onChange={(e) => {
                  onChange("areaMaxSlider", Number(e.target.value));
                }}
                onMouseUp={() => {
                  onSliderCommit({
                    maxArea: areaMax >= 500 ? "" : String(areaMax),
                  });
                  onApply();
                }}
                onTouchEnd={() => {
                  onSliderCommit({
                    maxArea: areaMax >= 500 ? "" : String(areaMax),
                  });
                  onApply();
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Loại bất động sản */}
          <div>
            <label className="text-xs text-gray-500">Loại bất động sản</label>
            <select
              id="y8u4km"
              className="mt-1 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
              value={query.type}
              onChange={(e) => onChange("type", e.target.value)}
            >
              <option value="">Tất cả</option>

              <option value="Nhà riêng">Nhà riêng</option>
              <option value="Đất">Đất</option>
              <option value="Chung cư">Chung cư</option>
              <option value="Biệt thự">Biệt thự</option>
              <option value="Kho xưởng">Kho xưởng</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div>
            <label className="text-xs text-gray-500">Sắp xếp</label>
            <select
              id="x5m2ra"
              className="mt-1 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
              value={query.sort || "newest"}
              onChange={(e) => onChange("sort", e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="area_desc">Diện tích lớn nhất</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Tìm theo title / khu vực / loại
          </label>
          <input
            className="mt-1 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
            placeholder="Ví dụ: Linh Chiểu, Nhà riêng..."
            value={query.q}
            onChange={(e) => onChange("q", e.target.value)}
          />
        </div>
      </div>

      {/* mobile results */}
      <div className="sm:hidden mt-4">
        <div id="h7v3qs" className="text-xs text-gray-500">
          {loading ? "Hiển thị ... / ... bất động sản" : resultsCountText}
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <button
          className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition"
          onClick={onApply}
        >
          Áp dụng
        </button>
        <button
          className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 transition"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </section>
  );
}
