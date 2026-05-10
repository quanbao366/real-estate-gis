"use client";

import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    // Chỉ invalidate 1 lần sau khi map mount.
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return null;
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.MapContainer })),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.TileLayer })),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Marker })),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Popup })),
  { ssr: false },
);

function formatPrice(rawPrice) {
  // Chuẩn hóa theo đơn vị DB: 1 đơn vị = 100,000 VND
  const value = Number(rawPrice) * 100000;
  if (!value || Number.isNaN(value)) return "";

  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(2).replace(/\.00$/, "") + " tỷ";
  }

  if (value >= 1000000) {
    return (value / 1000000).toFixed(0) + " triệu";
  }

  return value.toLocaleString("vi-VN") + " đ";
}

export default function MapSection({ center, radiusKm, loading, properties }) {
  const markers = useMemo(() => properties || [], [properties]);

  return (
    <section
      id="map"
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Bản đồ GIS</h2>
          <p className="text-xs text-gray-500">
            Marker lấy từ PostGIS • Responsive
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Center: {center[0]}, {center[1]} • Radius: {radiusKm}km
        </div>
      </div>

      <div className="h-[400px] sm:h-[420px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3" />
              <div className="text-sm font-semibold">
                Đang hiển thị bản đồ...
              </div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ResizeMap />

            {markers.map((prop, idx) => {
              const lat = parseFloat(prop.latitude);
              const lng = parseFloat(prop.longitude);
              if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

              return (
                <Marker
                  key={prop.id || prop.listing_id || idx}
                  position={[lat, lng]}
                >
                  <Popup maxWidth={360}>
                    <div className="min-w-[260px]">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2">
                        {prop.title}
                      </h3>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-emerald-600 font-extrabold">
                          {prop.price !== null && prop.price !== undefined
                            ? formatPrice(prop.price)
                            : ""}
                        </div>
                        <div className="text-xs text-gray-500">
                          {prop.area ? `${prop.area} m²` : ""}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {prop.location}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prop.property_type ? (
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            🏷️ {prop.property_type}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </section>
  );
}
