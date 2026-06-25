"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import Navbar from "../../_components/Navbar";
import VirtualTourModal from "../../_components/VirtualTourModal";

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

import { useMap } from "react-leaflet";

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    // Chỉ invalidate 1 lần ngay sau khi map mount/ready.
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

function formatPrice(rawPrice) {
  // Chuẩn hóa theo đơn vị DB: 1 đơn vị = 100,000 VND
  const value = Number(rawPrice) * 100000;
  if (!value || Number.isNaN(value)) return "Liên hệ";

  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(2).replace(/\.00$/, "") + " tỷ";
  }

  if (value >= 1000000) {
    return (value / 1000000).toFixed(0) + " triệu";
  }

  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike);
  return d.toLocaleDateString("vi-VN");
}

export default function PropertyDetailPage({ params }) {
  const id = params?.id;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vrOpen, setVrOpen] = useState(false);

  const lat = property?.latitude ?? property?.lat;
  const lng = property?.longitude ?? property?.lng;

  const center = useMemo(() => {
    const a = parseFloat(lat);
    const b = parseFloat(lng);
    if (Number.isFinite(a) && Number.isFinite(b)) return [a, b];
    return [10.8231, 106.6297];
  }, [lat, lng]);

  useEffect(() => {
    if (!id) return;
    console.log("FETCH PROPERTY:", id);

    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `http://localhost:5000/api/properties/${id}`;
        const res = await fetch(url);

        // Tránh lỗi: backend trả HTML (404/route sai) → res.json() sẽ crash
        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (_) {
          data = { error: text?.slice(0, 200) || "Invalid response" };
        }

        if (!res.ok)
          throw new Error(
            data?.error || data?.success === false
              ? data?.error
              : "Fetch failed",
          );

        // Backend chuẩn: { success: true, data }
        if (data?.success === true) setProperty(data.data);
        else setProperty(data?.data || data);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Không thể tải dữ liệu");
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const openGoogleMaps = () => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar radiusKm={10} setRadiusKm={() => {}} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => history.back()}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
          >
            ← Quay lại
          </button>

          <button
            onClick={openGoogleMaps}
            disabled={!lat || !lng}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xem trên Google Maps
          </button>
        </div>

        <section className="bg-white border rounded-2xl shadow-sm p-5 md:p-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Đang tải chi tiết...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : property ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-extrabold line-clamp-2">
                    {property.title || "Không có tiêu đề"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {property.location || "—"}
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <div className="text-emerald-600 font-extrabold text-lg">
                    {property.price !== null && property.price !== undefined
                      ? formatPrice(property.price)
                      : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {property.area ? `${property.area} m²` : "—"}
                  </div>

                  {property?.virtual_tour_url ? (
                    <button
                      onClick={() => setVrOpen(true)}
                      className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                      Xem VR 360
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-gray-50 border rounded-2xl p-3">
                  <div className="text-xs text-gray-500">Loại bất động sản</div>
                  <div className="font-semibold mt-1">
                    {property.property_type || "—"}
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-2xl p-3">
                  <div className="text-xs text-gray-500">Tọa độ</div>
                  <div className="font-semibold mt-1">
                    {lat && lng ? `${lat}, ${lng}` : "—"}
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-2xl p-3">
                  <div className="text-xs text-gray-500">Ngày đăng</div>
                  <div className="font-semibold mt-1">
                    {formatDate(property.posted_at || property.created_at)}
                  </div>
                </div>
              </div>

              {property.description ? (
                <div className="bg-gray-50 border rounded-2xl p-4">
                  <div className="text-xs text-gray-500">Mô tả</div>
                  <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              Không tìm thấy bất động sản.
            </div>
          )}
        </section>

        <VirtualTourModal
          open={vrOpen}
          onClose={() => setVrOpen(false)}
          virtualTourUrl={property?.virtual_tour_url}
          title={property?.title}
        />

        <section className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold">Bản đồ vị trí</h2>
              <p className="text-xs text-gray-500">
                Marker nổi bật theo PostGIS
              </p>
            </div>
          </div>

          <div className="h-[450px]">
            {!property ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Đang tải map...
              </div>
            ) : !property?.latitude && !property?.lat ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Không có tọa độ để hiển thị bản đồ.
              </div>
            ) : !property?.longitude && !property?.lng ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Không có tọa độ để hiển thị bản đồ.
              </div>
            ) : !lat || !lng ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Không có tọa độ để hiển thị bản đồ.
              </div>
            ) : (
              <MapContainer
                center={center}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ResizeMap />

                {lat && lng ? (
                  <Marker position={[parseFloat(lat), parseFloat(lng)]}>
                    <Popup maxWidth={360}>
                      <div className="min-w-[240px]">
                        <h3 className="font-bold text-sm line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="text-emerald-600 font-extrabold mt-2">
                          {property.price !== null &&
                          property.price !== undefined
                            ? formatPrice(property.price)
                            : "—"}
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-2">
                          {property.location || `${lat}, ${lng}`}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ) : null}
              </MapContainer>
            )}
          </div>
        </section>

        <section className="bg-white border rounded-2xl shadow-sm p-5">
          <h3 className="font-bold">Thông tin bổ sung</h3>
          <div className="mt-3 text-sm text-gray-700">
            {property?.bedrooms ? <>🛏️ {property.bedrooms} phòng ngủ</> : null}
            {property?.bathrooms ? (
              <>
                {" "}
                <span className="mx-2">•</span>🚿 {property.bathrooms} phòng tắm
              </>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
