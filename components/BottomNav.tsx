"use client";

// Нижняя навигация mobile-first (раздел 37 ТЗ): состав зависит от роли.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export default function BottomNav({ role }: { role: Role | null }) {
  const { t } = useI18n();
  const pathname = usePathname();

  const items =
    role === "BUSINESS"
      ? [
          { href: "/home", label: t.nav.home, icon: "🏠" },
          { href: "/business-dashboard", label: t.nav.products, icon: "📦" },
          { href: "/orders", label: t.nav.orders, icon: "🧾" },
          { href: "/messages", label: t.nav.messages, icon: "💬" },
          { href: "/profile", label: t.nav.profile, icon: "👤" },
        ]
      : role === "ADMIN"
        ? [
            { href: "/home", label: t.nav.home, icon: "🏠" },
            { href: "/search", label: t.nav.search, icon: "🔍" },
            { href: "/admin", label: t.nav.admin, icon: "🛡" },
            { href: "/messages", label: t.nav.messages, icon: "💬" },
            { href: "/profile", label: t.nav.profile, icon: "👤" },
          ]
        : [
            { href: "/home", label: t.nav.home, icon: "🏠" },
            { href: "/search", label: t.nav.search, icon: "🔍" },
            { href: "/map", label: t.nav.map, icon: "🗺" },
            { href: "/messages", label: t.nav.messages, icon: "💬" },
            { href: "/profile", label: t.nav.profile, icon: "👤" },
          ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                active ? "text-brand-600" : "text-ink-400 hover:text-ink-700"
              )}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              <span className="truncate px-0.5">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
