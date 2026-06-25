"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../_components/Navbar";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function formatError(err) {
  return String(err?.message || err?.error || "Có lỗi xảy ra");
}

function ConfirmModal({
  open,
  title = "Xác nhận",
  message,
  confirmText = "Xóa",
  cancelText = "Hủy",
  loading,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl border shadow-lg p-5">
        <div>
          <div className="text-lg font-extrabold">{title}</div>
          <div className="text-sm text-gray-600 mt-2">{message}</div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-extrabold hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-extrabold hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Đang xóa..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPropertiesPage() {
  const router = useRouter();

  const token = useMemo(() => getToken(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPropertyId, setModalPropertyId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 3000);
  };

  const fetchMyProperties = async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/my-properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Không tải được dữ liệu");
      }

      setProperties(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(formatError(e));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async () => {
    const idNum = Number(modalPropertyId);
    if (!Number.isFinite(idNum) || !token) {
      setModalOpen(false);
      return;
    }

    setDeleteLoading(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:5000/api/properties/${idNum}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Xóa tin thất bại");
      }

      // Update list ngay
      setProperties((prev) => prev.filter((p) => Number(p.id) !== idNum));

      showToast("success", "Xóa tin thành công");
      setModalOpen(false);
      setModalPropertyId(null);
    } catch (e) {
      showToast("error", "Xóa tin thất bại");
      setError(formatError(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar radiusKm={10} setRadiusKm={() => {}} />

      <main className="max-w-7xl mx-auto px-4 py-4">
        <section className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold">Tin của tôi</h1>
              <p className="text-xs text-gray-500 mt-1">
                Chỉnh sửa hoặc xóa các tin bạn đã đăng.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/create-property")}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-extrabold hover:bg-indigo-700"
              >
                Đăng tin
              </button>
            </div>
          </div>

          {toast.open ? (
            <div
              className={
                "mt-4 rounded-2xl border p-4 text-sm font-semibold " +
                (toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800")
              }
              role={toast.type === "success" ? "status" : "alert"}
            >
              {toast.message}
            </div>
          ) : null}

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
              {properties.map((p) => {
                const id = Number(p.id);
                return (
                  <div
                    key={p.id}
                    className="border rounded-2xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm line-clamp-2">
                        {p.title || "(Không có tiêu đề)"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {p.location || ""}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Giá: {p.price ?? "—"}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/edit-property/${id}`)}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-extrabold hover:bg-gray-50"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalPropertyId(id);
                          setModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-sm font-extrabold text-red-700 hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center" aria-live="polite">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-2xl">🗂️</span>
              </div>
              <div className="mt-4 font-semibold text-sm text-gray-900">
                Chưa có tin đăng
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Hãy đăng tin bất động sản để hiển thị tại đây.
              </div>
            </div>
          )}
        </section>
      </main>

      <ConfirmModal
        open={modalOpen}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa tin này không? Thao tác này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={deleteLoading}
        onCancel={() => {
          if (deleteLoading) return;
          setModalOpen(false);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
