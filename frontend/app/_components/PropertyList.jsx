import React from "react";
import PropertyCard from "./PropertyCard";

export default function PropertyList({
  loading,
  properties,
  onSelectProperty,
}) {
  return (
    <section
      className="bg-white rounded-2xl border shadow-sm p-4"
      aria-label="Danh sách"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-bold text-base">Danh sách bất động sản</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hiển thị card dạng dọc, ưu tiên trải nghiệm duyệt.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : properties?.length ? (
        <div className="space-y-3">
          {properties.map((property, idx) => {
            return (
              <PropertyCard
                key={property.id || property.listing_id || idx}
                property={property}
                onSelectProperty={onSelectProperty}
              />
            );
          })}
        </div>
      ) : (
        <div id="i3n9qe" className="py-12 text-center" aria-live="polite">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 text-2xl">🔎</span>
          </div>
          <div className="mt-4 font-semibold text-sm text-gray-900">
            Không tìm thấy bất động sản phù hợp
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Hãy thử thay đổi bộ lọc
          </div>
        </div>
      )}
    </section>
  );
}
