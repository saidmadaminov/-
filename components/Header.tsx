"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import type { Role } from "@/types";

export default function Header({ user }: { user: { name: string; role: Role } | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:px-5">
        <Link href={user ? "/home" : "/"} className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.svg" alt="Naydi" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-extrabold tracking-tight text-brand-700">Naydi</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Link href="/search" className="btn-ghost">{t.nav.search}</Link>
          <Link href="/map" className="btn-ghost">{t.nav.map}</Link>
          <Link href="/messages" className="btn-ghost">{t.nav.messages}</Link>
          <Link href="/assistant" className="btn-ghost">🤖 {t.nav.assistant}</Link>
          {user?.role === "BUSINESS" && (
            <Link href="/business-dashboard" className="btn-ghost">{t.nav.dashboard}</Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="btn-ghost">{t.nav.admin}</Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
                aria-label={t.nav.profile}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-card">
                  <div className="border-b border-ink-100 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-ink-400">{user.role}</p>
                  </div>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-ink-50">
                    {t.nav.profile}
                  </Link>
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-ink-50">
                    {t.nav.orders}
                  </Link>
                  <Link href="/favorites" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-ink-50">
                    {t.nav.favorites}
                  </Link>
                  {user.role === "BUSINESS" && (
                    <Link href="/business-dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-ink-50">
                      {t.nav.dashboard}
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-ink-50">
                      {t.nav.admin}
                    </Link>
                  )}
                  <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary !px-3 !py-1.5 text-xs">{t.nav.login}</Link>
              <Link href="/register" className="btn-primary !px-3 !py-1.5 text-xs">{t.nav.register}</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
