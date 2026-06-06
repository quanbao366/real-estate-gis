"use client";

import React, { useEffect, useMemo, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Chip({ active, label, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "px-3 py-2 rounded-full text-xs font-semibold border transition whitespace-nowrap",
        "focus:outline-none hover:-translate-y-[1px]",
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

function PresetButton({ active, label, onClick, valueLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full text-left px-3 py-2 rounded-2xl border transition",
        "hover:bg-gray-50 hover:-translate-y-[1px]",
        active
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-white border-gray-200 text-gray-700",
      )}
      aria-pressed={active}
    >
      <div className="text-xs font-extrabold">{label}</div>
      {valueLabel ? (
        <div className="mt-1 text-[11px] opacity-90">{valueLabel}</div>
      ) : null}
    </button>
  );
}

function SectionTitle({ title, desc }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      {desc ? <div className="text-xs text-gray-500 mt-1">{desc}</div> : null}
    </div>
  );
}

function SkeletonLine() {
  return <div className="h-10 rounded-2xl bg-gray-100 animate-pulse" />;
}

function propertiesSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <SkeletonLine />
      <SkeletonLine />
      <SkeletonLine />
    </div>
  );
}

export default function FilterSectionV2({
  query,
  onChange,
  onApply,
  onReset,
  loading,
  total,
}) {
  const resultsCountText = useMemo(() => {
    const t = Number(total || 0);
    if (loading) return "Hiển thị ... / ... bất động sản";
    const shown = t > 0 ? Math.min(20, t) : 0;
    return `Hiển thị ${shown} / ${t} bất động sản`;
  }, [loading, total]);

  // Presets
  const pricePresets = [
    { key: "p1", label: "Dưới 3 tỷ", minPrice: "", maxPrice: "3" },
    { key: "p2", label: "3 - 5 tỷ", minPrice: "3", maxPrice: "5" },
    { key: "p3", label: "5 - 10 tỷ", minPrice: "5", maxPrice: "10" },
    { key: "p4", label: "10 - 20 tỷ", minPrice: "10", maxPrice: "20" },
    { key: "p5", label: "Trên 20 tỷ", minPrice: "20", maxPrice: "" },
  ];

  const areaPresets = [
    { key: "a1", label: "< 50m²", minArea: "", maxArea: "50" },
    { key: "a2", label: "50 - 100m²", minArea: "50", maxArea: "100" },
    { key: "a3", label: "100 - 300m²", minArea: "100", maxArea: "300" },
    { key: "a4", label: "> 300m²", minArea: "300", maxArea: "" },
  ];

  const typeChips = [
    { key: "", label: "Tất cả" },
    { key: "Nhà riêng", label: "Nhà riêng" },
    { key: "Đất", label: "Đất" },
    { key: "Chung cư", label: "Căn hộ" },
    { key: "Kho xưởng", label: "Kho/xưởng" },
  ];

  const areaLocalPresets = [
    { key: "TP Thủ Đức", label: "TP Thủ Đức" },
    { key: "Bình Thạnh", label: "Bình Thạnh" },
    { key: "Tân Phú", label: "Tân Phú" },
    { key: "Quận 7", label: "Quận 7" },
  ];

  // Bedrooms/Bathrooms (min only)
  const bedPresets = [
    { key: "", label: "Tất cả" },
    { key: "1", label: "≥ 1 PN" },
    { key: "2", label: "≥ 2 PN" },
    { key: "3", label: "≥ 3 PN" },
    { key: "4", label: "≥ 4 PN" },
  ];

  const bathPresets = [
    { key: "", label: "Tất cả" },
    { key: "1", label: "≥ 1 WC" },
    { key: "2", label: "≥ 2 WC" },
    { key: "3", label: "≥ 3 WC" },
    { key: "4", label: "≥ 4 WC" },
  ];

  const appliedPriceKey = useMemo(() => {
    const minP = query.minPrice || "";
    const maxP = query.maxPrice || "";
    return (
      pricePresets.find((p) => p.minPrice === minP && p.maxPrice === maxP)
        ?.key || ""
    );
  }, [query.minPrice, query.maxPrice]);

  const appliedAreaKey = useMemo(() => {
    const minA = query.minArea || "";
    const maxA = query.maxArea || "";
    return (
      areaPresets.find((a) => a.minArea === minA && a.maxArea === maxA)?.key ||
      ""
    );
  }, [query.minArea, query.maxArea]);

  // Debounced search (frontend only for debounce; backend called via onApply)
  const [searchDraft, setSearchDraft] = useState(query.q || "");
  useEffect(() => {
    setSearchDraft(query.q || "");
  }, [query.q]);

  useEffect(() => {
    // Khi mount/trang mới mở, không apply bất kỳ filter nào.
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      onChange("q", searchDraft);
      // Không apply ngay khi mở trang.
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <aside
      id="filter"
      className="bg-white rounded-3xl border shadow-sm p-4 md:p-5"
      aria-label="Bộ lọc"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold text-base">Bộ lọc</h2>
          <p className="text-xs text-gray-500 mt-1">
            Giá, diện tích, loại & khu vực.
          </p>
        </div>

        <div className="hidden sm:block text-xs text-gray-500 text-right">
          <div>{loading ? "Đang cập nhật..." : "Sẵn sàng"}</div>
          <div className="mt-2 font-semibold text-gray-900">
            {resultsCountText}
          </div>
        </div>
      </div>

      {loading ? propertiesSkeleton() : null}

      <div className="space-y-5">
        {/* Giá */}
        <section>
          <SectionTitle title="Giá" desc="Chọn nhanh theo preset" />
          <div className="grid grid-cols-1 gap-2">
            {pricePresets.map((p) => (
              <PresetButton
                key={p.key}
                active={appliedPriceKey === p.key}
                label={p.label}
                valueLabel={
                  p.minPrice && p.maxPrice
                    ? `${p.minPrice} - ${p.maxPrice} tỷ`
                    : p.minPrice
                      ? `≥ ${p.minPrice} tỷ`
                      : p.maxPrice
                        ? `< ${p.maxPrice} tỷ`
                        : ""
                }
                onClick={() => {
                  onChange("minPrice", p.minPrice);
                  onChange("maxPrice", p.maxPrice);
                  // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
                }}
              />
            ))}
          </div>
        </section>

        {/* Diện tích */}
        <section>
          <SectionTitle title="Diện tích" desc="Chọn theo mốc phổ biến" />
          <div className="grid grid-cols-1 gap-2">
            {areaPresets.map((a) => (
              <PresetButton
                key={a.key}
                active={appliedAreaKey === a.key}
                label={a.label}
                valueLabel={
                  a.minArea && a.maxArea
                    ? `${a.minArea} - ${a.maxArea} m²`
                    : a.minArea
                      ? `≥ ${a.minArea} m²`
                      : a.maxArea
                        ? `< ${a.maxArea} m²`
                        : ""
                }
                onClick={() => {
                  onChange("minArea", a.minArea);
                  onChange("maxArea", a.maxArea);
                  // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
                }}
              />
            ))}
          </div>
        </section>

        {/* Loại */}
        <section>
          <SectionTitle title="Loại bất động sản" desc="Chip clickable" />
          <div className="flex flex-wrap gap-2">
            {typeChips.map((t) => (
              <Chip
                key={t.key || "all"}
                active={(query.type || "") === (t.key || "")}
                label={t.label}
                onClick={() => {
                  onChange("type", t.key);
                  // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
                }}
              />
            ))}
          </div>
        </section>

        {/* Khu vực */}
        <section>
          <SectionTitle title="Khu vực" desc="Dựa trên field Location" />
          <div className="flex flex-wrap gap-2">
            <Chip
              active={!query.location}
              label="Tất cả khu vực"
              onClick={() => {
                onChange("location", "");
                // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
              }}
            />
            {areaLocalPresets.map((l) => (
              <Chip
                key={l.key}
                active={query.location === l.key}
                label={l.label}
                onClick={() => {
                  onChange("location", l.key);
                  // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
                }}
              />
            ))}
          </div>
        </section>

        {/* Bedrooms */}
        <section>
          <SectionTitle title="Phòng ngủ" desc="Tối thiểu (>=)" />
          <div className="flex flex-wrap gap-2">
            {bedPresets.map((b) => (
              <Chip
                key={b.key}
                active={String(query.minBedrooms || "") === b.key}
                label={b.label}
                onClick={() => {
                  onChange("minBedrooms", b.key);
                  // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
                }}
              />
            ))}
          </div>
        </section>

        {/* Bathrooms */}
        <section>
          <SectionTitle title="Phòng tắm" desc="Tối thiểu (>=)" />
          <div className="flex flex-wrap gap-2">
            {bathPresets.map((b) => (
              <Chip
                key={b.key}
                active={String(query.minBathrooms || "") === b.key}
                label={b.label}
                onClick={() => {
                  onChange("minBathrooms", b.key);
                  // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
                }}
              />
            ))}
          </div>
        </section>

        {/* Tìm kiếm */}
        <section>
          <SectionTitle
            title="Tìm kiếm"
            desc="Debounce 450ms (backend realtime)"
          />
          <input
            className="mt-1 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
            placeholder="Ví dụ: Linh Chiểu, Nhà riêng..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </section>

        {/* Sắp xếp */}
        <section>
          <SectionTitle title="Sắp xếp" />
          <select
            className="mt-1 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
            value={query.sort || "newest"}
            onChange={(e) => {
              onChange("sort", e.target.value);
              // Chỉ cập nhật UI state. Backend gọi khi bấm "Áp dụng".
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="area_desc">Diện tích lớn nhất</option>
          </select>
        </section>

        {/* Actions */}
        <section>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <button
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition"
              onClick={onApply}
              type="button"
            >
              Áp dụng
            </button>
            <button
              className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 transition"
              onClick={onReset}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="sm:hidden mt-3 text-xs text-gray-500 text-right">
            {resultsCountText}
          </div>
        </section>
      </div>
    </aside>
  );
}
