"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "./_components/Navbar";
import PropertyList from "./_components/PropertyList";
import MapSection from "./_components/MapSection";
import FilterSectionV2 from "./_components/FilterSectionV2";
import Pagination from "./_components/Pagination";
import ChatWidget from "./_components/ChatWidget";

const DEFAULT_CENTER = [10.8231, 106.6297];
const DEFAULT_RADIUS_KM = 10;
const DEFAULT_LIMIT = 20;

function buildQueryParams(query) {
  // Chỉ include param thực sự được chọn.
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.location) params.set("location", query.location);
  if (query.minBedrooms) params.set("minBedrooms", query.minBedrooms);
  if (query.minBathrooms) params.set("minBathrooms", query.minBathrooms);

  if (query.sort) params.set("sort", query.sort);

  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.minArea) params.set("minArea", query.minArea);
  if (query.maxArea) params.set("maxArea", query.maxArea);

  // Không gắn lat/lng/radius mặc định -> backend sẽ không ST_DWithin.
  // Nếu bạn muốn lọc theo bán kính trong future, sẽ add thêm ở đây.

  return params;
}

export default function HomePage() {
  useEffect(() => {
    // Bảo đảm khi quay lại từ /favorites thì luôn reset về đầu trang (tránh kẹt anchor/scroll)
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const initialUIQuery = useMemo(
    () => ({
      q: "",
      type: "",
      location: "",
      minBedrooms: "",
      minBathrooms: "",
      sort: "newest",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
    }),
    [],
  );

  const [uiQuery, setUiQuery] = useState(initialUIQuery);
  // appliedQuery chỉ cập nhật khi user bấm "Áp dụng"
  const [appliedQuery, setAppliedQuery] = useState(initialUIQuery);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const [favoritesSet, setFavoritesSet] = useState(() => new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const listRef = useMemo(() => ({ current: null }), []);

  const fetchProperties = useCallback(async (query, page = 1) => {
    setLoading(true);
    try {
      const params = buildQueryParams(query);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const url = `http://localhost:5000/api/properties?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Fetch failed");
      }

      setProperties(Array.isArray(data?.data) ? data.data : []);
      const t = Number(data?.total || 0);
      setTotal(t);
      setTotalPages(Number(data?.totalPages || 0));
    } catch (e) {
      console.error(e);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    if (favoritesLoaded) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setFavoritesSet(new Set());
      setFavoritesLoaded(true);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Fetch favorites failed");

      const favRows = Array.isArray(data?.data) ? data.data : [];
      const next = new Set(favRows.map((p) => p.id));
      setFavoritesSet(next);
    } catch (e) {
      console.error(e);
      setFavoritesSet(new Set());
    } finally {
      setFavoritesLoaded(true);
    }
  }, [favoritesLoaded]);

  const onToggleFavorite = useCallback(
    async (propertyId) => {
      const token = localStorage.getItem("token");
      if (!token) {
        // chưa login thì không cho thao tác lưu
        return;
      }

      const id = Number(propertyId);
      if (!Number.isFinite(id)) return;

      const currentlyFavorite = favoritesSet.has(id);

      // optimistic update
      setFavoritesSet((prev) => {
        const next = new Set(prev);
        if (currentlyFavorite) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        const method = currentlyFavorite ? "DELETE" : "POST";
        const url = `http://localhost:5000/api/favorites/${id}`;

        const res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          // rollback
          setFavoritesSet((prev) => {
            const next = new Set(prev);
            if (currentlyFavorite) next.add(id);
            else next.delete(id);
            return next;
          });
          throw new Error(data?.error || "Toggle favorite failed");
        }
      } catch (e) {
        console.error(e);
      }
    },
    [favoritesSet],
  );

  // Load lần đầu: không áp filter mặc định => gọi API với query rỗng.
  useEffect(() => {
    fetchProperties({
      ...initialUIQuery,
      // Đảm bảo không gửi min/max/type/location mặc định.
      // sort vẫn giữ để backend có ORDER BY.
      q: "",
      type: "",
      location: "",
      minBedrooms: "",
      minBathrooms: "",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
    });
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProperties, loadFavorites]);

  const handleChange = useCallback((key, value) => {
    setUiQuery((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(
    (payloadOverride) => {
      const nextAppliedQuery = payloadOverride
        ? { ...uiQuery, ...payloadOverride }
        : uiQuery;
      setAppliedQuery(nextAppliedQuery);
      setCurrentPage(1);
      fetchProperties(nextAppliedQuery, 1);
    },
    [fetchProperties, uiQuery],
  );

  const handleReset = useCallback(() => {
    setUiQuery(initialUIQuery);
    setAppliedQuery(initialUIQuery);

    // Reset cũng phải fetch lại ngay.
    fetchProperties({
      ...initialUIQuery,
      q: "",
      type: "",
      location: "",
      minBedrooms: "",
      minBathrooms: "",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
    });
  }, [fetchProperties, initialUIQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar radiusKm={DEFAULT_RADIUS_KM} setRadiusKm={() => {}} />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div id="list" ref={(el) => (listRef.current = el)}>
          <PropertyList
            loading={loading}
            properties={properties}
            favoritesSet={favoritesSet}
            onToggleFavorite={onToggleFavorite}
            onSelectProperty={(prop) => {
              const id = prop?.id || prop?.listing_id;
              setSelectedPropertyId(id || null);
            }}
          />

          {properties?.length ? (
            <div className="mt-4">
              <Pagination
                page={currentPage}
                total={total}
                limit={limit}
                loading={loading}
                onChangePage={(p) => {
                  const next = Math.max(1, p);
                  setCurrentPage(next);
                  fetchProperties(appliedQuery, next);
                  setTimeout(() => {
                    listRef.current?.scrollIntoView?.({ behavior: "smooth" });
                  }, 50);
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 order-1 lg:order-2">
            <MapSection
              center={DEFAULT_CENTER}
              radiusKm={DEFAULT_RADIUS_KM}
              loading={loading}
              properties={properties}
              selectedPropertyId={selectedPropertyId}
            />
          </div>

          <div className="lg:col-span-4 order-2 lg:order-1">
            <FilterSectionV2
              query={uiQuery}
              loading={loading}
              total={total}
              onChange={handleChange}
              onApply={handleApply}
              onReset={handleReset}
            />
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
