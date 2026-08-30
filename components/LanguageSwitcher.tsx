"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const router = useRouter();

  const set = (l: "ru" | "en") => {
    document.cookie = `naydi_locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  };

  return (
    <div className={cn("flex items-center gap-0.5 rounded-full bg-ink-100 p-0.5", compact && "scale-90")}>
      <button
        onClick={() => set("ru")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition",
          locale === "ru" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
        )}
      >
        RU
      </button>
      <button
        onClick={() => set("en")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition",
          locale === "en" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
        )}
      >
        EN
      </button>
    </div>
  );
}
