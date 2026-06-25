"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeTruncate(s, n) {
  const str = String(s ?? "");
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function formatPropertyLine(p) {
  if (!p) return "";
  const parts = [];
  if (p.title) parts.push(p.title);
  if (p.price != null && p.price !== "") parts.push(`Giá: ${p.price}`);
  if (p.area != null && p.area !== "") parts.push(`DT: ${p.area}m²`);
  if (p.location) parts.push(p.location);
  return parts.join(" · ");
}

const DEFAULT_BOT_TEXT =
  "Chào bạn! Hỏi mình về giá, khu vực hoặc loại bất động sản nhé. Ví dụ: “Dưới 3 tỷ ở Thủ Đức”, “Đếm xem bao nhiêu căn hộ dưới 5 tỷ ở Bình Thạnh”.";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const scrollRef = useRef(null);
  const STORAGE_KEY = "datn_chat_history_v1";

  const canSend = useMemo(() => {
    return !loading && String(input || "").trim().length > 0;
  }, [input, loading]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setMessages(arr);
          return;
        }
      }
    } catch {
      // ignore
    }

    setMessages([
      {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: DEFAULT_BOT_TEXT,
        properties: [],
        createdAt: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      scrollRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }, 30);
  }, [messages, open, loading]);

  async function callChatApi(text) {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || "Chat API failed");
    }
    return data;
  }

  async function onSend() {
    const text = String(input || "").trim();
    if (!text) return;

    setErrorText("");
    setLoading(true);
    setInput("");

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      properties: [],
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const data = await callChatApi(text);
      const botMsg = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: data?.text || "Xin lỗi, mình chưa xử lý được câu hỏi này.",
        properties: Array.isArray(data?.properties) ? data.properties : [],
        createdAt: Date.now(),
        count: data?.count,
        intent: data?.intent,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setErrorText(String(e?.message || "Lỗi khi gọi chatbot"));
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          text: "Có lỗi xảy ra khi tìm kiếm. Bạn thử lại với câu hỏi khác nhé.",
          properties: [],
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <div className="pointer-events-none">
      {/* Floating button */}
      <button
        type="button"
        className={cx(
          "pointer-events-auto fixed bottom-5 right-5 z-40",
          "w-14 h-14 md:w-16 md:h-16 rounded-full",
          "bg-indigo-600 hover:bg-indigo-700 transition shadow-lg",
          "text-white flex items-center justify-center",
          "focus:outline-none",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng chatbot" : "Mở chatbot"}
      >
        💬
      </button>

      {/* Popup */}
      {open ? (
        <div
          className={cx(
            "pointer-events-auto fixed z-40 bottom-24 right-4 md:right-6",
            "w-[calc(100vw-2rem)] max-w-[420px]",
            "h-[60vh] md:h-[520px]",
            "bg-white border rounded-2xl shadow-xl overflow-hidden flex flex-col",
          )}
          role="dialog"
          aria-label="Chatbot tư vấn bất động sản"
        >
          <div className="p-3 border-b flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-extrabold text-sm">Chat tư vấn BĐS</div>
              <div className="text-xs text-gray-500">
                Tìm theo giá, khu vực, loại…
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-lg border hover:bg-gray-50"
                onClick={() => {
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                  } catch {}
                  setMessages([
                    {
                      id: `bot-${Date.now()}`,
                      role: "bot",
                      text: DEFAULT_BOT_TEXT,
                      properties: [],
                      createdAt: Date.now(),
                    },
                  ]);
                }}
                aria-label="Xóa lịch sử"
              >
                Xóa
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-lg border hover:bg-gray-50"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto p-3 space-y-3"
            aria-live="polite"
          >
            {messages.map((m) => {
              const isBot = m.role === "bot";
              return (
                <div
                  key={m.id}
                  className={cx(
                    "flex",
                    isBot ? "justify-start" : "justify-end",
                  )}
                >
                  <div
                    className={cx(
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                      isBot
                        ? "bg-gray-100 text-gray-900 border border-gray-200"
                        : "bg-indigo-600 text-white",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {isBot &&
                    Array.isArray(m.properties) &&
                    m.properties.length ? (
                      <div className="mt-2 space-y-2">
                        {m.properties.slice(0, 5).map((p) => (
                          <div
                            key={p?.id ?? p?.listing_id}
                            className="text-xs bg-white/60 border border-gray-200 rounded-xl p-2 text-gray-800"
                          >
                            <div className="font-semibold">
                              {safeTruncate(p?.title, 40) ||
                                "(Không có tiêu đề)"}
                            </div>
                            <div className="mt-1 opacity-90">
                              {formatPropertyLine(p)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-900">
                  Đang tìm…
                </div>
              </div>
            ) : null}

            {errorText ? (
              <div className="flex justify-start">
                <div className="bg-red-50 border border-red-200 rounded-2xl px-3 py-2 text-sm text-red-800">
                  {errorText}
                </div>
              </div>
            ) : null}

            <div ref={scrollRef} />
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 resize-none border rounded-2xl px-3 py-2 text-sm bg-white"
                rows={1}
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button
                type="button"
                className={cx(
                  "px-4 py-2 rounded-2xl font-bold text-sm transition",
                  canSend
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed",
                )}
                onClick={() => {
                  if (canSend) onSend();
                }}
                disabled={!canSend}
              >
                Gửi
              </button>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Ví dụ: “Dưới 3 tỷ ở Thủ Đức”, “Loại đất ở Quận 7”, “Đếm bao nhiêu
              căn hộ dưới 5 tỷ ở Bình Thạnh”.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
