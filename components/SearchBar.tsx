"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

export default function SearchBar({ initialQuery = "", big = false }: { initialQuery?: string; big?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  const go = () => {
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={t.common.searchPlaceholder}
          className={`input pl-10 ${big ? "!py-3.5 !text-base" : ""}`}
          aria-label={t.common.searchPlaceholder}
        />
      </div>
      {/* Кнопка микрофона — задел под голосовой поиск (раздел 7 ТЗ) */}
      <button
        type="button"
        title="Голосовой поиск — скоро"
        disabled
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-300"
      >
        🎙
      </button>
      <button onClick={go} className={`btn-primary shrink-0 ${big ? "!py-3.5" : ""}`}>
        {t.nav.search}
      </button>
    </div>
  );
}
