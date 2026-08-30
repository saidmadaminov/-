"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { TargetType } from "@/types";

export default function FavoriteButton({
  targetType,
  targetId,
  initial = false,
  isLoggedIn = false,
}: {
  targetType: TargetType;
  targetId: string;
  initial?: boolean;
  isLoggedIn?: boolean;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActive(data.active);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border transition",
        active ? "border-red-200 bg-red-50 text-red-500" : "border-ink-200 bg-white text-ink-300 hover:text-red-400"
      )}
      title={active ? t.common.inFavorite : t.common.toFavorite}
      aria-label={t.common.toFavorite}
    >
      {active ? "❤" : "♡"}
    </button>
  );
}
