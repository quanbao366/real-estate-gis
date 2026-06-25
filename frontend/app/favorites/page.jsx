"use client";

import { useEffect, useMemo, useState } from "react";

import Navbar from "../_components/Navbar";
import PropertyCard from "../_components/PropertyCard";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState([]);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      setError("");
      try {
        if (!token) {
          setProperties([]);
          return;
        }

        const res = await fetch("http://localhost:5000/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Fetch favorites failed");
        }

        setProperties(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Không thể tải danh sách yêu thích");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar radiusKm={10} setRadiusKm={() => {}} />

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <section className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold">Bất động sản yêu thích</h1>
              <p className="text-xs text-gray-500 mt-1">
                Quản lý các tin bạn đã lưu.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Đang tải...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : properties?.length ? (
            <div className="mt-4 space-y-3">
              {properties.map((property, idx) => (
                <PropertyCard
                  key={property.id || property.listing_id || idx}
                  property={property}
                  favoriteState={{ isFavorite: true }}
                  disableToggle={true}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center" aria-live="polite">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-2xl">❤️</span>
              </div>
              <div className="mt-4 font-semibold text-sm text-gray-900">
                Chưa có tin yêu thích
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Lưu tin bằng nút ♡ trên danh sách bất động sản.
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
