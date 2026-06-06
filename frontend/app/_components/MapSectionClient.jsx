"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";

// Only access Leaflet on client runtime.
// IMPORTANT: leaflet.markercluster must be loaded to expose L.markerClusterGroup.
const getLeaflet = () => {
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line global-require
  const L = require("leaflet");

  // eslint-disable-next-line global-require
  require("leaflet.markercluster");

  return L;
};

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, [map]);

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

function formatPrice(rawPrice) {
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

function createTypeIcon(type) {
  const Llocal = getLeaflet();
  if (!Llocal) return null;

  const normalized = String(type || "").toLowerCase();

  const map = {
    "nhà riêng": { bg: "#4f46e5", glyph: "🏠" },
    "nha rieng": { bg: "#4f46e5", glyph: "🏠" },
    đất: { bg: "#16a34a", glyph: "🌱" },
    dat: { bg: "#16a34a", glyph: "🌱" },
    "căn hộ": { bg: "#0284c7", glyph: "🏢" },
    "can ho": { bg: "#0284c7", glyph: "🏢" },
    kho: { bg: "#f59e0b", glyph: "🏭" },
    xưởng: { bg: "#f59e0b", glyph: "🏭" },
    "kho/xưởng": { bg: "#f59e0b", glyph: "🏭" },
    "kho/xuong": { bg: "#f59e0b", glyph: "🏭" },
    "kho xưởng": { bg: "#f59e0b", glyph: "🏭" },
    "kho xuong": { bg: "#f59e0b", glyph: "🏭" },
  };

  let def = { bg: "#6b7280", glyph: "📍" };
  for (const key of Object.keys(map)) {
    if (normalized === key || normalized.includes(key)) {
      def = map[key];
      break;
    }
  }

  const html = `
    <div style="width:34px;height:34px;border-radius:9999px;background:${def.bg};display:flex;align-items:center;justify-content:center;
                box-shadow:0 6px 18px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.9);">
      <span style="font-size:16px;line-height:1;transform:translateY(1px);">${def.glyph}</span>
    </div>
  `;

  return Llocal.divIcon({
    className: "",
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function buildPopupHtml(prop) {
  const safe = (v, fallback) => {
    if (v === null || v === undefined) return fallback;
    const s = String(v).trim();
    return s ? s : fallback;
  };

  const title = safe(prop.title, "Không có tiêu đề");
  const areaVal = safe(prop.area, "Chưa cập nhật");
  const area = areaVal === "Chưa cập nhật" ? "Chưa cập nhật" : `${areaVal} m²`;
  const type = safe(prop.property_type, "Chưa cập nhật");
  const location = safe(prop.location, "Chưa cập nhật");

  const price =
    prop.price !== null && prop.price !== undefined
      ? safe(formatPrice(prop.price), "Chưa cập nhật")
      : "Chưa cập nhật";

  const detailsHref =
    prop.id || prop.listing_id
      ? `/property/${prop.id || prop.listing_id}`
      : "#";

  return `
    <div style="min-width:300px; padding:16px; border-radius:18px; background:#fff; box-shadow:0 12px 34px rgba(17,24,39,0.14); border:1px solid rgba(99,102,241,0.12);">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px;">
        <div style="font-weight:1000; font-size:15px; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; color:#111827;">${title}</div>
        <div style="color:#059669; font-weight:1000; font-size:14px; white-space:nowrap;">${price}</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div style="background:#f9fafb; border:1px solid rgba(17,24,39,0.06); border-radius:14px; padding:10px 10px;">
          <div style="font-size:11px; font-weight:900; color:#6b7280; margin-bottom:4px;">DIỆN TÍCH</div>
          <div style="font-size:13px; font-weight:900; color:#111827;">${area}</div>
        </div>
        <div style="background:#f9fafb; border:1px solid rgba(17,24,39,0.06); border-radius:14px; padding:10px 10px;">
          <div style="font-size:11px; font-weight:900; color:#6b7280; margin-bottom:4px;">LOẠI</div>
          <div style="font-size:13px; font-weight:900; color:#111827;">${type}</div>
        </div>
      </div>

      <div style="background:#eef2ff; border:1px solid rgba(99,102,241,0.18); border-radius:14px; padding:10px 12px; margin-bottom:12px;">
        <div style="font-size:11px; font-weight:900; color:#4338ca; margin-bottom:4px;">KHU VỰC</div>
        <div style="font-size:13px; font-weight:1000; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${location}</div>
      </div>

      <a href="${detailsHref}" style="display:inline-flex; align-items:center; justify-content:center; gap:8px;
        width:100%; text-decoration:none; background:#4f46e5; color:#fff; font-weight:1000; font-size:13px;
        padding:11px 12px; border-radius:14px; box-shadow:0 8px 20px rgba(79,70,229,0.25);">
        Xem chi tiết <span aria-hidden="true">→</span>
      </a>
    </div>
  `;
}

function MapMarkers({
  markers,
  center,
  radiusKm,
  selectedPropertyId,
  onMarkerReady,
}) {
  const map = useMap();
  const clusterRef = useRef(null);
  const markerByIdRef = useRef(new Map());
  const circleRef = useRef(null);

  const normalizedRadiusM = useMemo(() => {
    const v = Number(radiusKm || 0);
    return Math.max(0, v) * 1000;
  }, [radiusKm]);

  const upsertCircle = useCallback(() => {
    const Llocal = getLeaflet();
    if (!Llocal) return;
    if (!normalizedRadiusM) return;

    if (!circleRef.current) {
      const c = Llocal.circle([center[0], center[1]], {
        radius: normalizedRadiusM,
        color: "#4f46e5",
        weight: 2,
        fillColor: "rgba(79,70,229,0.15)",
        fillOpacity: 1,
      });
      c.addTo(map);
      circleRef.current = c;
    } else {
      circleRef.current.setLatLng([center[0], center[1]]);
      circleRef.current.setRadius(normalizedRadiusM);
    }
  }, [center, map, normalizedRadiusM]);

  useEffect(() => {
    if (!clusterRef.current) {
      const Llocal = getLeaflet();
      if (!Llocal) return;
      const cluster = Llocal.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true,
      });
      cluster.addTo(map);
      clusterRef.current = cluster;
    }

    // rebuild markers
    clusterRef.current.clearLayers();
    markerByIdRef.current.clear();

    const cluster = clusterRef.current;

    for (let i = 0; i < markers.length; i++) {
      const prop = markers[i] || {};
      const lat = parseFloat(prop.latitude);
      const lng = parseFloat(prop.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

      const id = prop.id || prop.listing_id || String(i);

      const Llocal = getLeaflet();
      if (!Llocal) continue;
      // Prevent any permanent/static label from being rendered.
      // (This project should show details only via popup.)
      const marker = Llocal.marker([lat, lng], {
        icon: createTypeIcon(prop.property_type),
      });

      const popupHtml = buildPopupHtml(prop);
      marker.bindPopup(popupHtml, {
        maxWidth: 380,
        closeButton: false,
        className: "bbx-property-popup",
      });

      marker.on("click", () => {
        marker.openPopup();
      });

      markerByIdRef.current.set(id, marker);
      cluster.addLayer(marker);
    }

    upsertCircle();
    onMarkerReady?.(markerByIdRef.current);
  }, [markers, map, onMarkerReady, upsertCircle]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const marker = markerByIdRef.current.get(selectedPropertyId);
    if (!marker) return;

    const latlng = marker.getLatLng();
    map.flyTo(latlng, Math.max(map.getZoom(), 14), { duration: 0.5 });
    setTimeout(() => marker.openPopup(), 250);
  }, [map, selectedPropertyId]);

  return null;
}

export default function MapSectionClient({
  center,
  radiusKm,
  loading,
  properties,
  selectedPropertyId,
}) {
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
            minZoom={3}
            maxZoom={19}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ResizeMap />
            <MapMarkers
              markers={markers}
              center={center}
              radiusKm={radiusKm}
              selectedPropertyId={selectedPropertyId}
            />
          </MapContainer>
        )}
      </div>
    </section>
  );
}
