"use client";

import React from "react";

function formatPrice(rawPrice) {
  // Chuẩn hóa theo đơn vị DB: 1 đơn vị = 100,000 VND
  const value = Number(rawPrice) * 100000;
  if (!value || Number.isNaN(value)) return "—";

  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(2).replace(/\.00$/, "") + " tỷ";
  }

  if (value >= 1000000) {
    return (value / 1000000).toFixed(0) + " triệu";
  }

  return value.toLocaleString("vi-VN") + " đ";
}

function PlaceholderIcon() {
  return (
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
      <span className="text-indigo-600 text-xl">🏠</span>
    </div>
  );
}

export default function PropertyCard({ property, onSelectProperty }) {
  const p = property || {};

  const title = p.title || "Không có tiêu đề";
  const location = p.location || "";
  const area = p.area ? `${p.area} m²` : "—";
  const type = p.property_type || "—";

  const lat = p.latitude ?? p.lat ?? "";
  const lng = p.longitude ?? p.lng ?? "";

  return (
    <article
      className="group bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
      onClick={() => {
        if (onSelectProperty) onSelectProperty(property);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (onSelectProperty) onSelectProperty(property);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <PlaceholderIcon />
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-sm line-clamp-2">{title}</h3>
          <p className="text-xs text-gray-500 truncate mt-1">{location}</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500">Giá</div>
              <div className="text-emerald-600 font-extrabold text-sm">
                {p.price !== null && p.price !== undefined
                  ? formatPrice(p.price)
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Diện tích</div>
              <div className="text-sm font-semibold">{area}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Loại</div>
              <div className="text-sm font-semibold">{type}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Khu vực / tọa độ</div>
              <div className="text-sm font-semibold truncate">
                {p.location ? p.location : `${lat}, ${lng}`}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {p.bedrooms ? (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  🛏️ {p.bedrooms} PN
                </span>
              ) : null}
              {p.bathrooms ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  🚿 {p.bathrooms} WC
                </span>
              ) : null}
            </div>

            <a
              href={
                p.id || p.listing_id ? `/property/${p.id || p.listing_id}` : "#"
              }
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
            >
              Xem chi tiết →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
