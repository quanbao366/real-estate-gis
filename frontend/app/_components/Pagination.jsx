import React from "react";

export default function Pagination({
  page,
  total,
  limit,
  onChangePage,
  loading,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
  const current = Math.min(totalPages, Math.max(1, page));

  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-center justify-between gap-3">
      <div className="text-xs text-gray-500">
        Trang <span className="font-semibold">{current}</span> / {totalPages} •
        Tổng {total}
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-2 rounded-xl border text-sm font-semibold transition ${
            current <= 1 || loading
              ? "opacity-50 cursor-not-allowed bg-gray-50"
              : "hover:bg-gray-50"
          }`}
          disabled={current <= 1 || loading}
          onClick={() => onChangePage(current - 1)}
        >
          ← Previous
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            if (
              p < current - 2 ||
              (p > current + 2 && p !== 1 && p !== totalPages)
            )
              return null;
            const isEllipsis =
              (p === current - 3 && current - 3 > 1) ||
              (p === current + 3 && current + 3 < totalPages);
            if (isEllipsis) {
              // render ... placeholder
              return (
                <span key={`e-${p}`} className="px-2 text-gray-400">
                  …
                </span>
              );
            }
            return (
              <button
                key={p}
                onClick={() => onChangePage(p)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition border ${
                  p === current
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          className={`px-3 py-2 rounded-xl border text-sm font-semibold transition ${
            current >= totalPages || loading
              ? "opacity-50 cursor-not-allowed bg-gray-50"
              : "hover:bg-gray-50"
          }`}
          disabled={current >= totalPages || loading}
          onClick={() => onChangePage(current + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
