"use client";

// 📍 Бишкек / текущее местоположение + ручное изменение (раздел 6 ТЗ).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

export default function LocationChip({
  city,
  hasCoords,
}: {
  city?: string | null;
  hasCoords: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "denied">("idle");

  const detect = () => {
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        setState("idle");
        router.refresh();
      },
      () => setState("denied"),
      { timeout: 8000 }
    );
  };

  return (
    <button
      onClick={detect}
      className="chip !py-1.5 text-xs"
      title={t.common.nearMe}
    >
      📍 {hasCoords ? t.common.nearMe : city || t.common.bishkek}
      {state === "loading" && <span className="animate-pulse">…</span>}
      {state === "denied" && <span title="Геолокация недоступна">🚫</span>}
    </button>
  );
}
