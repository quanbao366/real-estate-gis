"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Chip({ active, label, onClick, icon, rightIcon }) {
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
      {rightIcon ? <span className="ml-2">{rightIcon}</span> : null}
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

function parseDigitsOnly(s) {
  // Supports Telex/IME: we do NOT format while typing.
  // Here we only convert at apply-time.
  const str = String(s ?? "");
  const trimmed = str.trim();
  if (!trimmed) return "";
  // Keep only digits (user may paste with separators)
  const digits = trimmed.replace(/[^0-9]/g, "");
  return digits;
}

function toDBPriceFromBillionDraft(billionDraft) {
  // UI: tỷ
  // DB: rawPrice with current dataset behavior.
  // Requirement: payload example
  // 3 tỷ -> 30000
  // Formula: dbPrice = billionValue * 10000
  const digits = parseDigitsOnly(billionDraft);
  if (!digits) return "";

  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return "";

  // dbPrice stored as raw number (backend parses float)
  const db = n * 10000;
  if (!Number.isFinite(db) || db <= 0) return "";

  // Keep as string to be safe
  return String(db);
}

function formatBillionChipText(minPrice, maxPrice) {
  // minPrice/maxPrice are DB rawPrice numbers/strings
  const minDigits = parseDigitsOnly(minPrice);
  const maxDigits = parseDigitsOnly(maxPrice);

  const hasMin = minDigits !== "";
  const hasMax = maxDigits !== "";

  if (!hasMin && !hasMax) return "";

  const toBillion = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return "";
    // inverse: raw = tỷ*10000 => tỷ = raw/10000
    // keep integer if close to int
    const b = n / 10000;
    // Avoid scientific notation; show without trailing .0
    if (Number.isInteger(b)) return String(b);
    return String(b).replace(/\.0+$/, "");
  };

  const minT = hasMin ? toBillion(minDigits) : "";
  const maxT = hasMax ? toBillion(maxDigits) : "";

  if (hasMin && hasMax) return `Giá: ${minT} - ${maxT} tỷ`;
  if (hasMin) return `Giá: ≥ ${minT} tỷ`;
  return `Giá: ≤ ${maxT} tỷ`;
}

function formatAreaChipText(minArea, maxArea) {
  const minDigits = parseDigitsOnly(minArea);
  const maxDigits = parseDigitsOnly(maxArea);

  const hasMin = minDigits !== "";
  const hasMax = maxDigits !== "";

  if (!hasMin && !hasMax) return "";

  if (hasMin && hasMax) return `Diện tích: ${minDigits} - ${maxDigits} m²`;
  if (hasMin) return `Diện tích: ≥ ${minDigits} m²`;
  return `Diện tích: ≤ ${maxDigits} m²`;
}

export default function FilterSectionV2({
  query,
  onChange,
  onApply,
  onReset,
  loading,
  total,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Requirement: single local state object (local state only)
  const [filterDraft, setFilterDraft] = useState({
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    propertyType: "",
    location: "",
    sort: query?.sort || "newest",
  });

  // Prevent overwriting IME composition
  const composingRef = useRef(false);

  useEffect(() => {
    if (composingRef.current) return;

    // Sync from query -> drafts
    // query.minPrice/maxPrice are DB raw numbers.
    // Convert to billion display for draft.
    const toBillionDraft = (raw) => {
      const digits = parseDigitsOnly(raw);
      if (!digits) return "";
      const n = Number(digits);
      if (!Number.isFinite(n) || n <= 0) return "";
      // inverse: raw = tỷ*10000 => tỷ = raw/10000
      const b = n / 10000;
      if (Number.isInteger(b)) return String(b);
      return String(b).replace(/\.0+$/, "");
    };

    setFilterDraft((prev) => ({
      ...prev,
      minPrice: query?.minPrice ? toBillionDraft(query.minPrice) : "",
      maxPrice: query?.maxPrice ? toBillionDraft(query.maxPrice) : "",
      minArea: query?.minArea || "",
      maxArea: query?.maxArea || "",
      propertyType: query?.type || "",
      location: query?.location || "",
      sort: query?.sort || prev.sort || "newest",
    }));
  }, [
    query?.minPrice,
    query?.maxPrice,
    query?.minArea,
    query?.maxArea,
    query?.type,
    query?.location,
    query?.sort,
  ]);

  const resultsCountText = useMemo(() => {
    const t = Number(total || 0);
    if (loading) return "Hiển thị ... / ... bất động sản";
    const shown = t > 0 ? Math.min(20, t) : 0;
    return `Hiển thị ${shown} / ${t} bất động sản`;
  }, [loading, total]);

  const typeChips = [
    { key: "", label: "Tất cả" },
    { key: "Nhà riêng", label: "Nhà riêng" },
    { key: "Đất", label: "Đất" },
    { key: "Chung cư", label: "Căn hộ" },
    { key: "Kho xưởng", label: "Kho/xưởng" },
  ];

  const locationPresets = [
    { key: "TP Thủ Đức", label: "TP Thủ Đức" },
    { key: "Bình Thạnh", label: "Bình Thạnh" },
    { key: "Tân Phú", label: "Tân Phú" },
    { key: "Quận 7", label: "Quận 7" },
  ];

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

  // Requirement: onChange only stores raw strings (no conversion)
  const setDraftField = (key, value) => {
    setFilterDraft((prev) => ({ ...prev, [key]: value }));
    // do not call onChange here to avoid state/input mismatch
  };

  const activePriceChip = useMemo(() => {
    return formatBillionChipText(query?.minPrice, query?.maxPrice);
  }, [query?.minPrice, query?.maxPrice]);

  const activeAreaChip = useMemo(() => {
    return formatAreaChipText(query?.minArea, query?.maxArea);
  }, [query?.minArea, query?.maxArea]);

  const buildPayload = () => {
    const minPriceDB = toDBPriceFromBillionDraft(filterDraft.minPrice);
    const maxPriceDB = toDBPriceFromBillionDraft(filterDraft.maxPrice);

    const minArea = filterDraft.minArea.trim()
      ? String(parseDigitsOnly(filterDraft.minArea))
      : "";
    const maxArea = filterDraft.maxArea.trim()
      ? String(parseDigitsOnly(filterDraft.maxArea))
      : "";

    // backend expects minArea/maxArea as numbers/strings convertible by parseFloat
    const payload = {
      minPrice: minPriceDB !== "" ? minPriceDB : "",
      maxPrice: maxPriceDB !== "" ? maxPriceDB : "",
      minArea: minArea !== "" ? minArea : "",
      maxArea: maxArea !== "" ? maxArea : "",
    };

    // Add propertyType/location/sort via existing onChange mapping
    return payload;
  };

  const applyNow = () => {
    const priceAreaPayload = buildPayload();

    const payload = {
      minPrice: priceAreaPayload.minPrice
        ? Number(priceAreaPayload.minPrice)
        : "",
      maxPrice: priceAreaPayload.maxPrice
        ? Number(priceAreaPayload.maxPrice)
        : "",
      minArea: priceAreaPayload.minArea ? Number(priceAreaPayload.minArea) : "",
      maxArea: priceAreaPayload.maxArea ? Number(priceAreaPayload.maxArea) : "",
      propertyType: filterDraft.propertyType || "",
      location: filterDraft.location || "",
      sort: filterDraft.sort || "newest",
    };

    // Requirement: debug payload exactly before API
    const apiPayload = {
      minPrice: payload.minPrice,
      maxPrice: payload.maxPrice,
      minArea: payload.minArea,
      maxArea: payload.maxArea,
    };

    console.log("FILTER PAYLOAD", apiPayload);

    // Flow mong muốn:
    // Input draft -> convert -> setActiveFilter -> call onApply(payload)
    // Không đợi onChange state update rồi mới áp dụng.
    onChange("minPrice", payload.minPrice);
    onChange("maxPrice", payload.maxPrice);
    onChange("minArea", payload.minArea);
    onChange("maxArea", payload.maxArea);
    onChange("type", payload.propertyType);
    onChange("location", payload.location);
    onChange("sort", payload.sort);

    // onApply phải có tác dụng ngay
    onApply({
      ...apiPayload,
      type: payload.propertyType,
      location: payload.location,
      sort: payload.sort,
    });
  };

  const resetAll = () => {
    setFilterDraft({
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
      propertyType: "",
      location: "",
      sort: "newest",
    });

    // Call empty filter
    onChange("minPrice", "");
    onChange("maxPrice", "");
    onChange("minArea", "");
    onChange("maxArea", "");
    onChange("type", "");
    onChange("location", "");
    onChange("sort", "newest");

    onReset?.();

    // Ensure onApply receives empty payload
    onApply?.({
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
    });
  };

  const clearPriceOnly = () => {
    setFilterDraft((prev) => ({ ...prev, minPrice: "", maxPrice: "" }));

    onChange("minPrice", "");
    onChange("maxPrice", "");

    // Call apply directly so parent fetch happens immediately.
    onApply?.({
      minPrice: "",
      maxPrice: "",
      minArea: query?.minArea || "",
      maxArea: query?.maxArea || "",
      type: filterDraft.propertyType || "",
      location: filterDraft.location || "",
      sort: filterDraft.sort || "newest",
    });
  };

  const clearAreaOnly = () => {
    setFilterDraft((prev) => ({ ...prev, minArea: "", maxArea: "" }));

    onChange("minArea", "");
    onChange("maxArea", "");

    onApply?.({
      minPrice: query?.minPrice || "",
      maxPrice: query?.maxPrice || "",
      minArea: "",
      maxArea: "",
      type: filterDraft.propertyType || "",
      location: filterDraft.location || "",
      sort: filterDraft.sort || "newest",
    });
  };

  // Bedrooms/Bathrooms: spec didn't include in state object, keep using query only (applies via onChange)
  const currentMinBedrooms = query?.minBedrooms || "";
  const currentMinBathrooms = query?.minBathrooms || "";

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
            Giá, diện tích, loại & khu vực
          </p>
        </div>

        <button
          type="button"
          className="text-xs font-bold text-gray-600 hover:text-gray-900 transition"
          onClick={() => setIsCollapsed((v) => !v)}
        >
          {isCollapsed ? "Mở" : "Thu gọn"}
        </button>
      </div>

      {loading ? propertiesSkeleton() : null}

      {!isCollapsed ? (
        <div className="space-y-5">
          {/* Active filter chips */}
          <section>
            <div className="text-xs font-extrabold text-gray-900">Đang lọc</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {activePriceChip ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border border-indigo-100 bg-indigo-50 text-indigo-800">
                  <span>{activePriceChip.replace(/^Giá:\s*/, "")}</span>
                  <button
                    type="button"
                    aria-label="Xóa giá"
                    className="text-indigo-800 hover:text-indigo-950"
                    onClick={clearPriceOnly}
                  >
                    ✕
                  </button>
                </div>
              ) : null}

              {activeAreaChip ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border border-indigo-100 bg-indigo-50 text-indigo-800">
                  <span>{activeAreaChip.replace(/^Diện tích:\s*/, "")}</span>
                  <button
                    type="button"
                    aria-label="Xóa diện tích"
                    className="text-indigo-800 hover:text-indigo-950"
                    onClick={clearAreaOnly}
                  >
                    ✕
                  </button>
                </div>
              ) : null}

              {!activePriceChip && !activeAreaChip ? (
                <span className="text-xs text-gray-500">
                  Chưa chọn điều kiện
                </span>
              ) : null}
            </div>

            <div className="mt-2">
              <button
                type="button"
                className="text-xs font-bold text-gray-600 hover:text-gray-900 transition"
                onClick={resetAll}
              >
                Reset
              </button>
            </div>
          </section>

          {/* Price */}
          <section>
            <SectionTitle title="Giá" desc="Nhập theo tỷ (tỷ * 10000 => DB)" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Giá từ
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                      placeholder="Ví dụ: 3"
                      value={filterDraft.minPrice}
                      onCompositionStart={() => {
                        composingRef.current = true;
                      }}
                      onCompositionEnd={() => {
                        composingRef.current = false;
                      }}
                      onChange={(e) => {
                        setDraftField("minPrice", e.target.value);
                      }}
                    />
                    <span className="text-xs text-gray-500">tỷ</span>
                  </div>
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Giá đến
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                      placeholder="Ví dụ: 5"
                      value={filterDraft.maxPrice}
                      onCompositionStart={() => {
                        composingRef.current = true;
                      }}
                      onCompositionEnd={() => {
                        composingRef.current = false;
                      }}
                      onChange={(e) => {
                        setDraftField("maxPrice", e.target.value);
                      }}
                    />
                    <span className="text-xs text-gray-500">tỷ</span>
                  </div>
                </label>
              </div>

              {query?.minPrice || query?.maxPrice ? (
                <button
                  type="button"
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition"
                  onClick={clearPriceOnly}
                >
                  Xóa giá
                </button>
              ) : null}
            </div>
          </section>

          {/* Area */}
          <section>
            <SectionTitle title="Diện tích" desc="Nhập m²" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Diện tích từ
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                      placeholder="Ví dụ: 50"
                      value={filterDraft.minArea}
                      onCompositionStart={() => {
                        composingRef.current = true;
                      }}
                      onCompositionEnd={() => {
                        composingRef.current = false;
                      }}
                      onChange={(e) => {
                        setDraftField("minArea", e.target.value);
                      }}
                    />
                    <span className="text-xs text-gray-500">m²</span>
                  </div>
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Diện tích đến
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
                      placeholder="Ví dụ: 100"
                      value={filterDraft.maxArea}
                      onCompositionStart={() => {
                        composingRef.current = true;
                      }}
                      onCompositionEnd={() => {
                        composingRef.current = false;
                      }}
                      onChange={(e) => {
                        setDraftField("maxArea", e.target.value);
                      }}
                    />
                    <span className="text-xs text-gray-500">m²</span>
                  </div>
                </label>
              </div>

              {query?.minArea || query?.maxArea ? (
                <button
                  type="button"
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition"
                  onClick={clearAreaOnly}
                >
                  Xóa diện tích
                </button>
              ) : null}
            </div>
          </section>

          {/* Type */}
          <section>
            <SectionTitle title="Loại bất động sản" />
            <div className="flex flex-wrap gap-2">
              {typeChips.map((t) => (
                <Chip
                  key={t.key || "all"}
                  active={(filterDraft.propertyType || "") === (t.key || "")}
                  label={t.label}
                  onClick={() =>
                    setFilterDraft((prev) => ({ ...prev, propertyType: t.key }))
                  }
                />
              ))}
            </div>
          </section>

          {/* Location */}
          <section>
            <SectionTitle title="Khu vực" />
            <div className="flex flex-wrap gap-2">
              <Chip
                active={!filterDraft.location}
                label="Tất cả khu vực"
                onClick={() =>
                  setFilterDraft((prev) => ({ ...prev, location: "" }))
                }
              />
              {locationPresets.map((l) => (
                <Chip
                  key={l.key}
                  active={filterDraft.location === l.key}
                  label={l.label}
                  onClick={() =>
                    setFilterDraft((prev) => ({ ...prev, location: l.key }))
                  }
                />
              ))}
            </div>
          </section>

          {/* Bedrooms */}
          <section>
            <SectionTitle title="Phòng ngủ" />
            <div className="flex flex-wrap gap-2">
              {bedPresets.map((b) => (
                <Chip
                  key={b.key}
                  active={String(currentMinBedrooms || "") === b.key}
                  label={b.label}
                  onClick={() => onChange("minBedrooms", b.key)}
                />
              ))}
            </div>
          </section>

          {/* Bathrooms */}
          <section>
            <SectionTitle title="Phòng tắm" />
            <div className="flex flex-wrap gap-2">
              {bathPresets.map((b) => (
                <Chip
                  key={b.key}
                  active={String(currentMinBathrooms || "") === b.key}
                  label={b.label}
                  onClick={() => onChange("minBathrooms", b.key)}
                />
              ))}
            </div>
          </section>

          {/* Sort */}
          <section>
            <SectionTitle title="Sắp xếp" />
            <select
              className="mt-1 w-full border rounded-2xl px-3 py-2.5 text-sm bg-white"
              value={filterDraft.sort || "newest"}
              onChange={(e) =>
                setFilterDraft((prev) => ({ ...prev, sort: e.target.value }))
              }
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
                onClick={applyNow}
                type="button"
              >
                Áp dụng
              </button>
              <button
                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 transition"
                onClick={resetAll}
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
      ) : (
        <div className="text-xs text-gray-500">Đang lọc…</div>
      )}
    </aside>
  );
}
