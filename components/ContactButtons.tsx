"use client";

// Кнопки связи: Написать / Позвонить / Маршрут / Заказать (разделы 13–16 ТЗ).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { routeUrl } from "@/lib/geo";

export default function ContactButtons({
  providerUserId,
  phone,
  lat,
  lng,
  address,
  orderTarget,
  orderNote,
}: {
  providerUserId: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  orderTarget?: { type: "PRODUCT" | "SERVICE"; id: string; title: string };
  orderNote?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const write = async () => {
    if (!providerUserId) return;
    if (!document.cookie.includes("naydi_session")) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerUserId }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/messages?c=${data.id}`);
    }
  };

  const order = async () => {
    if (!orderTarget) return;
    if (!document.cookie.includes("naydi_session")) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: orderTarget.type,
        targetId: orderTarget.id,
        note: orderNote,
      }),
    });
    setBusy(false);
    if (res.ok) setOrdered(true);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {providerUserId && (
        <button onClick={write} disabled={busy} className="btn-primary flex-1 sm:flex-none">
          💬 {t.common.write}
        </button>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="btn-secondary flex-1 sm:flex-none">
          📞 {t.common.call}
        </a>
      )}
      <a href={routeUrl(lat, lng, address)} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 sm:flex-none">
        🧭 {t.common.route}
      </a>
      {orderTarget && !ordered && (
        <button onClick={order} disabled={busy} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 sm:flex-none">
          🛒 {orderTarget.type === "PRODUCT" ? t.common.buy : t.common.order}
        </button>
      )}
      {ordered && (
        <span className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 sm:flex-none">
          ✓ {t.order.created_ok}
        </span>
      )}
    </div>
  );
}
