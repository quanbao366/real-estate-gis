"use client";

import React, { useEffect, useMemo, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionTitle({ title, desc }) {
  return (
    <div className="mb-2">
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      {desc ? <div className="text-xs text-gray-500 mt-1">{desc}</div> : null}
    </div>
  );
}

function ChipButton({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "px-3 py-2 rounded-full text-xs font-semibold border transition whitespace-nowrap focus:outline-none",
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
      )}
    >
      {icon ? <span className="mr-1">{icon}</span> : null}
      {label}
    </button>
  );
}

function PresetButton({ active, label, onClick, subLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full text-left px-3 py-2 rounded-2xl border transition",
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50",
      )}
    >
      <div className="text-xs font-extrabold">{label}</div>
      {subLabel ? (
        <div
          className={cx(
            "text-[11px] mt-1",
            active ? "text-indigo-100" : "text-gray-500",
          )}
        >
          {subLabel}
        </div>
      ) : null}
    </button>
  );
}

function SkeletonRow({ className }) {
  return (
    <div
      className={cx("h-10 rounded-2xl bg-gray-100 animate-pulse", className)}
    />
  );
}

export default function FilterSection({
  query,
  onChange,
  onApply,
  onReset,
  loading,
  total,
}) {
  const [searchDraft, setSearchDraft] = useState(query.q || "");

  useEffect(() => {
    setSearchDraft(query.q || "");
  }, [query.q]);

  // debounce search -> backend query realtime
  useEffect(() => {
    const t = setTimeout(() => {
      onChange("q", searchDraft);
    }, 450);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const resultsCountText = useMemo(() => {
    const t = Number(total || 0);
    if (loading) return `Hiển thị ... / ${t || "..."} bất động sản`;
    const shown = t > 0 ? 20 : 0;
    return `Hiển thị ${shown} / ${t} bất động sản`;
  }, [loading, total]);

  // Preset mapping -> backend uses minPrice/maxPrice & minArea/maxArea
  const pricePresets = [
    { id: "p1", label: "Dưới 3 tỷ", minPrice: "", maxPrice: "3" },
    { id: "p2", label: "3 - 5 tỷ", minPrice: "3", maxPrice: "5" },
    { id: "p3", label: "5 - 10 tỷ", minPrice: "5", maxPrice: "10" },
    { id: "p4", label: "10 - 20 tỷ", minPrice: "10", maxPrice: "20" },
    { id: "p5", label: "Trên 20 tỷ", minPrice: "20", maxPrice: "" },
  ];

  const areaPresets = [
    { id: "a1", label: "< 50m²", minArea: "", maxArea: "50" },
    { id: "a2", label: "50 - 100m²", minArea: "50", maxArea: "100" },
    { id: "a3", label: "100 - 300m²", minArea: "100", maxArea: "300" },
    { id: "a4", label: "> 300m²", minArea: "300", maxArea: "" },
  ];

  const typeChips = [
    { id: "all", label: "Tất cả", value: "" },
    { id: "house", label: "Nhà riêng", value: "Nhà riêng" },
    { id: "land", label: "Đất", value: "Đất" },
    { id: "apt", label: "Căn hộ", value: "Chung cư" },
    { id: "warehouse", label: "Kho/xưởng", value: "Kho xưởng" },
  ];

  // Location presets (hardcode as requested)
  const locationChips = [
    { id: "tthuduc", label: "TP Thủ Đức", value: "TP Thủ Đức" },
    { id: "binhthanh", label: "Bình Thạnh", value: "Bình Thạnh" },
    { id: "tanphu", label: "Tân Phú", value: "Tân Phú" },
    { id: "q7", label: "Quận 7", value: "Quận 7" },
  ];

  // Bedrooms/Bathrooms min only
  const bedChips = [
    { id: "all", label: "Phòng ngủ", value: "" },
    { id: "b1", label: "Từ 1", value: "1" },
    { id: "b2", label: "Từ 2", value: "2" },
    { id: "b3", label: "Từ 3", value: "3" },
    { id: "b4", label: "Từ 4", value: "4" },
  ];

  const bathChips = [
    { id: "all", label: "Phòng tắm", value: "" },
    { id: "w1", label: "Từ 1", value: "1" },
    { id: "w2", label: "Từ 2", value: "2" },
    { id: "w3", label: "Từ 3", value: "3" },
    { id: "w4", label: "Từ 4", value: "4" },
  ];

  const activePrice = useMemo(() => {
    const min = query.minPrice ?? "";
    const max = query.maxPrice ?? "";
    return pricePresets.find(
      (p) => p.minPrice === (min || "") && p.maxPrice === (max || ""),
    )?.id;
  }, [query.minPrice, query.maxPrice]);

  const activeArea = useMemo(() => {
    const min = query.minArea ?? "";
    const max = query.maxArea ?? "";
    return areaPresets.find(
      (p) => p.minArea === (min || "") && p.maxArea === (max || ""),
    )?.id;
  }, [query.minArea, query.maxArea]);

  const currentType = query.type || "";
  const currentLocation = query.location || "";
  const currentMinBedrooms = query.minBedrooms || "";
  const currentMinBathrooms = query.minBathrooms || "";

  return (
    <aside
      id="filter"
      className="bg-white rounded-3xl border shadow-sm p-5 lg:sticky lg:top-[88px]"
      style={{ alignSelf: "flex-start" }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold text-base">Bộ lọc</h2>
          <p className="text-xs text-gray-500 mt-1">
            Lọc theo giá, diện tích, loại, khu vực và tiện ích.
          </p>
        </div>
        <div className="hidden sm:block text-xs text-gray-500 text-right">
          <div className="font-semibold text-gray-900">{resultsCountText}</div>
          <div className="mt-2">{loading ? "Đang cập nhật…" : "Sẵn sàng"}</div>
        </div>
      </div>

      {/* Search */}
      <SectionTitle title="Tìm kiếm" desc="Debounce realtime qua API" />
      <div className="relative">
        <input
          className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Ví dụ: Linh Chiểu, Nhà riêng..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {/* Price */}
        <div>
          <SectionTitle title="Giá" desc="Chọn nhanh preset" />
          <div className="grid grid-cols-1 gap-2">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              pricePresets.map((p) => (
                <PresetButton
                  key={p.id}
                  active={activePrice === p.id}
                  label={p.label}
                  onClick={() => {
                    // set draft UI values as well as applied query directly
                    // (backend filter realtime)
                    onChange("minPrice", p.minPrice);
                    onChange("maxPrice", p.maxPrice);
                    onApply();
                  }}
                  subLabel={
                    p.minPrice && p.maxPrice
                      ? `${p.minPrice} - ${p.maxPrice} tỷ`
                      : p.minPrice
                        ? `≥ ${p.minPrice} tỷ`
                        : p.maxPrice
                          ? `≤ ${p.maxPrice} tỷ`
                          : ""
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Area */}
        <div>
          <SectionTitle title="Diện tích" desc="Chọn nhanh preset" />
          <div className="grid grid-cols-1 gap-2">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              areaPresets.map((p) => (
                <PresetButton
                  key={p.id}
                  active={activeArea === p.id}
                  label={p.label}
                  onClick={() => {
                    onChange("minArea", p.minArea);
                    onChange("maxArea", p.maxArea);
                    onApply();
                  }}
                  subLabel={
                    p.minArea && p.maxArea
                      ? `${p.minArea} - ${p.maxArea} m²`
                      : p.minArea
                        ? `≥ ${p.minArea} m²`
                        : p.maxArea
                          ? `≤ ${p.maxArea} m²`
                          : ""
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Type */}
        <div>
          <SectionTitle title="Loại bất động sản" desc="Chip clickable" />
          <div className="flex flex-wrap gap-2">
            {typeChips.map((c) => (
              <ChipButton
                key={c.id}
                active={(currentType || "") === (c.value || "")}
                label={c.label}
                onClick={() => {
                  onChange("type", c.value);
                  onApply();
                }}
              />
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <SectionTitle title="Khu vực" desc="Preset theo field Location" />
          <div className="flex flex-wrap gap-2">
            <ChipButton
              active={!currentLocation}
              label="Tất cả"
              onClick={() => {
                onChange("location", "");
                onApply();
              }}
            />
            {locationChips.map((c) => (
              <ChipButton
                key={c.id}
                active={currentLocation === c.value}
                label={c.label}
                onClick={() => {
                  onChange("location", c.value);
                  onApply();
                }}
              />
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <SectionTitle title="Phòng ngủ" desc="Min (>=)" />
          <div className="flex flex-wrap gap-2">
            {bedChips.map((c) => (
              <ChipButton
                key={c.id}
                active={(currentMinBedrooms || "") === (c.value || "")}
                label={c.label}
                onClick={() => {
                  onChange("minBedrooms", c.value);
                  onApply();
                }}
                icon={c.value ? "🛏️" : null}
              />
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <SectionTitle title="Phòng tắm" desc="Min (>=)" />
          <div className="flex flex-wrap gap-2">
            {bathChips.map((c) => (
              <ChipButton
                key={c.id}
                active={(currentMinBathrooms || "") === (c.value || "")}
                label={c.label}
                onClick={() => {
                  onChange("minBathrooms", c.value);
                  onApply();
                }}
                icon={c.value ? "🚿" : null}
              />
            ))}
          </div>
        </div>

        {/* Sort + Apply/Reset */}
        <div>
          <SectionTitle title="Sắp xếp" desc="Chọn thứ tự hiển thị" />
          <select
            className="mt-2 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
            value={query.sort || "newest"}
            onChange={(e) => onChange("sort", e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="area_desc">Diện tích lớn nhất</option>
          </select>
        </div>

        <div className="sm:hidden">
          <div className="text-xs text-gray-500">{resultsCountText}</div>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button
            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition hover:translate-y-[-1px]"
            onClick={onApply}
          >
            Tìm kiếm
          </button>
          <button
            className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 transition hover:translate-y-[-1px]"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
}
