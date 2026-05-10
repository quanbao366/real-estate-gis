"use client";

import React, { useEffect, useMemo, useState } from "react";

import Navbar from "./_components/Navbar";
import FilterSection from "./_components/FilterSection";
import MapSection from "./_components/MapSection";
import PropertyList from "./_components/PropertyList";
import Pagination from "./_components/Pagination";

export default function Home() {
  const center = useMemo(() => [10.8231, 106.6297], []);

  const [radiusKm, setRadiusKm] = useState(10);

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Draft dùng cho UI slider/input
  const [draftQuery, setDraftQuery] = useState({
    // sliders (UI display default)
    priceMinSlider: 0,
    priceMaxSlider: 50,
    areaMinSlider: 30,
    areaMaxSlider: 500,

    q: "",
    type: "",
    sort: "newest",
  });

  // applied gửi lên API (GIÁ TRỊ NULL/"" sẽ được backend bỏ qua nếu thiếu param)
  const [appliedQuery, setAppliedQuery] = useState({
    q: "",
    type: "",
    sort: "newest",

    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
  });

  const [page, setPage] = useState(1);
  const limit = 10;

  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const radius = Math.max(1, Number(radiusKm)) * 1000;

        const params = new URLSearchParams({
          lat: String(center[0]),
          lng: String(center[1]),
          radius: String(radius),
          page: String(page),
          limit: String(limit),
        });

        // sliders: đổi UI thì chưa set min/max API. Chỉ update API khi đã apply hoặc slider end
        if (appliedQuery.minPrice !== "")
          params.set("minPrice", appliedQuery.minPrice);
        if (appliedQuery.maxPrice !== "")
          params.set("maxPrice", appliedQuery.maxPrice);
        if (appliedQuery.minArea !== "")
          params.set("minArea", appliedQuery.minArea);
        if (appliedQuery.maxArea !== "")
          params.set("maxArea", appliedQuery.maxArea);

        if (appliedQuery.q) params.set("q", appliedQuery.q);
        if (appliedQuery.type) params.set("type", appliedQuery.type);
        if (appliedQuery.sort && appliedQuery.sort !== "newest") {
          params.set("sort", appliedQuery.sort);
        }

        const url = `http://localhost:5000/api/properties?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();

        setProperties(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
      } catch (err) {
        console.error("Error fetching properties:", err);
        setProperties([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [center, radiusKm, page, limit, appliedQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar radiusKm={radiusKm} setRadiusKm={setRadiusKm} />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div id="list">
          <PropertyList loading={loading} properties={properties} />
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          loading={loading}
          onChangePage={(next) => setPage(next)}
        />

        {/* Footer row: | Filter | Map | */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 order-1 lg:order-2">
            <MapSection
              center={center}
              radiusKm={radiusKm}
              loading={loading}
              properties={properties}
            />
          </div>

          <div className="lg:col-span-4 order-2 lg:order-1">
            <FilterSection
              query={draftQuery}
              loading={loading}
              total={total}
              // realtime: search/type/sort cập nhật API ngay (page.js sẽ setAppliedQuery)
              onChange={(key, value) => {
                // Khi user chưa tương tác: KHÔNG apply filter vào API
                if (!hasUserInteracted) {
                  setHasUserInteracted(true);
                }

                // sliders UI update (không commit API)
                if (
                  key === "priceMinSlider" ||
                  key === "priceMaxSlider" ||
                  key === "areaMinSlider" ||
                  key === "areaMaxSlider"
                ) {
                  setDraftQuery((s) => ({ ...s, [key]: value }));
                  return;
                }

                // realtime: search/type/sort áp dụng ngay
                if (key === "q" || key === "type" || key === "sort") {
                  setDraftQuery((s) => ({ ...s, [key]: value }));
                  setPage(1);
                  setAppliedQuery((s) => ({ ...s, [key]: value }));
                  return;
                }

                setDraftQuery((s) => ({ ...s, [key]: value }));
              }}
              // Áp dụng: chuyển slider (min/max) từ draft -> applied (gọi API)
              onApply={() => {
                setHasUserInteracted(true);
                setPage(1);
                const next = {
                  ...appliedQuery,
                  q: draftQuery.q,
                  type: draftQuery.type,
                  sort: draftQuery.sort,

                  // chỉ set min/max nếu user đã thao tác (đã qua nút apply)
                  minPrice:
                    draftQuery.priceMinSlider <= 0
                      ? ""
                      : String(draftQuery.priceMinSlider),
                  maxPrice:
                    draftQuery.priceMaxSlider >= 50
                      ? ""
                      : String(draftQuery.priceMaxSlider),
                  minArea:
                    draftQuery.areaMinSlider <= 30
                      ? ""
                      : String(draftQuery.areaMinSlider),
                  maxArea:
                    draftQuery.areaMaxSlider >= 500
                      ? ""
                      : String(draftQuery.areaMaxSlider),
                };
                setAppliedQuery(next);
              }}
              onReset={() => {
                setHasUserInteracted(false);
                setDraftQuery({
                  priceMinSlider: 0,
                  priceMaxSlider: 50,
                  areaMinSlider: 30,
                  areaMaxSlider: 500,
                  q: "",
                  type: "",
                  sort: "newest",
                });
                setPage(1);
                setAppliedQuery({
                  q: "",
                  type: "",
                  sort: "newest",
                  minPrice: "",
                  maxPrice: "",
                  minArea: "",
                  maxArea: "",
                });
              }}
              // slider end: chỉ commit vào appliedQuery nếu đã user tương tác
              onSliderCommit={(commit) => {
                setHasUserInteracted(true);
                setPage(1);
                setAppliedQuery((s) => ({ ...s, ...commit }));
              }}
            />
          </div>
        </div>
      </main>

      <footer className="mt-6 bg-slate-900 text-slate-300 px-4 py-6">
        <div className="max-w-7xl mx-auto text-sm">
          <p className="font-semibold">DATN GIS Real Estate</p>
          <p className="text-xs text-slate-400 mt-1">
            Backend: Express + PostgreSQL/PostGIS • Frontend: Next.js + Tailwind
            + Leaflet
          </p>
        </div>
      </footer>
    </div>
  );
}
