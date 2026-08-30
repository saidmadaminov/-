"use client";

// Сортировка (раздел 10 ТЗ).
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { SORT_OPTIONS } from "@/types";

export default function SortSelect() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("sort") || "recommended";

  const labels: Record<string, string> = {
    recommended: t.sort.recommended,
    distance: t.sort.distance,
    price_asc: t.sort.price_asc,
    price_desc: t.sort.price_desc,
    rating: t.sort.rating,
    value: t.sort.value,
    in_stock: t.sort.in_stock,
    open_now: t.sort.open_now,
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-medium text-ink-400 sm:block">{t.common.sort}:</span>
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(sp.toString());
          next.set("sort", e.target.value);
          router.push(`/search?${next.toString()}`);
        }}
        className="input !w-auto !py-1.5 text-xs"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o} value={o}>{labels[o]}</option>
        ))}
      </select>
    </div>
  );
}
