"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-extrabold text-gray-900 mb-1">
        {label}
      </label>
      {children}
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    </div>
  );
}

export default function CreatePropertyPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [property_type, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    if (!String(title).trim()) return false;
    const p = Number(price);
    const a = Number(area);
    if (!Number.isFinite(p) || p <= 0) return false;
    if (!Number.isFinite(a) || a <= 0) return false;
    if (!String(property_type).trim()) return false;
    if (!String(location).trim()) return false;
    if (!String(description).trim()) return false;
    return true;
  }, [title, price, area, property_type, location, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!canSubmit) {
      setError("Vui lòng kiểm tra lại dữ liệu đầu vào.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: String(title).trim(),
          price: Number(price),
          area: Number(area),
          property_type: String(property_type).trim(),
          location: String(location).trim(),
          description: String(description).trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Tạo tin thất bại");
      }

      setSuccess("Đăng tin thành công! Đang chuyển về trang danh sách...");
      setTimeout(() => router.push("/"), 300);
    } catch (err) {
      setError(String(err?.message || "Tạo tin thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold">Đăng tin bất động sản</h2>
          <p className="text-sm text-gray-500 mt-1">
            Điền đầy đủ thông tin để tin của bạn hiển thị ngay trong danh sách.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border shadow-sm p-5 md:p-7"
        >
          <div className="space-y-5">
            {error ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 text-red-800 p-4 text-sm font-semibold"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            {success ? (
              <div
                className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4 text-sm font-semibold"
                role="status"
              >
                {success}
              </div>
            ) : null}

            <Field
              label="Tiêu đề"
              hint="Ví dụ: Nhà riêng hẻm xe hơi, gần chợ..."
            >
              <input
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Giá (VND)" hint="Số thực dương">
                <input
                  className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ví dụ: 300000000"
                />
              </Field>

              <Field label="Diện tích (m²)" hint="Số thực dương">
                <input
                  className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  inputMode="decimal"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ví dụ: 120"
                />
              </Field>
            </div>

            <Field label="Loại bất động sản">
              <select
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={property_type}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Chọn loại</option>
                <option value="Nhà riêng">Nhà riêng</option>
                <option value="Đất">Đất</option>
                <option value="Chung cư">Chung cư</option>
                <option value="Kho xưởng">Kho/xưởng</option>
                <option value="Khác">Khác</option>
              </select>
            </Field>

            <Field
              label="Địa chỉ"
              hint="Dùng để hiển thị & lọc theo trường location"
            >
              <input
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ví dụ: TP Thủ Đức, Đường số 8..."
              />
            </Field>

            <Field label="Mô tả" hint="Nêu ngắn gọn ưu điểm/khu vực/tiện ích">
              <textarea
                rows={6}
                className="w-full border rounded-2xl px-3 py-2.5 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả"
              />
            </Field>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-2xl font-extrabold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {submitting ? "Đang đăng..." : "Đăng tin"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-extrabold hover:bg-gray-50 transition"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
