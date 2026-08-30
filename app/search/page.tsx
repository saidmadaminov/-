// Страница результатов поиска (раздел 12 ТЗ): фильтры слева,
// результаты по центру, карта справа; на мобильном — список + кнопка карты.
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { getMapPoints, searchOffers } from "@/services/search";
import { BISHKEK_CENTER } from "@/lib/geo";
import SearchBar from "@/components/SearchBar";
import FiltersPanel from "@/components/FiltersPanel";
import SortSelect from "@/components/SortSelect";
import OfferCard from "@/components/OfferCard";
import MapViewClient from "@/components/MapViewClient";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SP {
  q?: string; type?: string; cat?: string; min?: string; max?: string;
  radius?: string; rating?: string; verified?: string; stock?: string;
  cond?: string; exp?: string; onsite?: string; sort?: string;
}

async function SearchResults({ sp }: { sp: SP }) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();
  const origin = user?.lat != null && user?.lng != null ? { lat: user.lat, lng: user.lng } : BISHKEK_CENTER;

  const num = (v?: string) => (v && !isNaN(Number(v)) ? Number(v) : null);
  const params = {
    q: sp.q || null,
    type: (sp.type || null) as never,
    categorySlug: sp.cat || null,
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    radiusKm: num(sp.radius),
    ratingMin: num(sp.rating),
    verifiedOnly: sp.verified === "1",
    inStockOnly: sp.stock === "1",
    condition: (sp.cond || null) as never,
    experienceMin: num(sp.exp),
    onSiteOnly: sp.onsite === "1",
    sort: sp.sort || "recommended",
    origin,
    limit: 60,
  };

  const [{ offers, total }, points, categories, favorites] = await Promise.all([
    searchOffers(params),
    getMapPoints(params),
    prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
      select: { slug: true, name: true, icon: true, parentId: true },
    }),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id } }).then((rows) => new Set(rows.map((f) => `${f.targetType}:${f.targetId}`)))
      : Promise.resolve(new Set<string>()),
  ]);

  const catOptions = categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, isParent: c.parentId == null }));
  const favIds = (o: { type: string; id: string }) => favorites.has(`${o.type}:${o.id}`);

  const typeTabs = [
    { key: "", label: t.common.all },
    { key: "PRODUCT", label: t.common.products },
    { key: "SERVICE", label: t.common.services },
    { key: "SPECIALIST", label: t.common.specialists },
    { key: "BUSINESS", label: t.common.businesses },
  ];

  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp as Record<string, string>);
    if (value) next.set(key, value);
    else next.delete(key);
    return `/search?${next.toString()}`;
  };

  return (
    <div className="space-y-4">
      <SearchBar initialQuery={sp.q || ""} />

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {typeTabs.map((tab) => (
          <Link key={tab.key} href={withParam("type", tab.key)} className={cn("chip", (sp.type || "") === tab.key && "chip-active")}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_400px]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <FiltersPanel categories={catOptions} />
          </div>
        </aside>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-500">
              <b className="text-ink-900">{total}</b> {t.common.results}
              {sp.q ? ` · «${sp.q}»` : ""}
            </p>
            <SortSelect />
          </div>
          <a
            href={`/map?${new URLSearchParams(
              Object.fromEntries(Object.entries(sp).filter(([, v]) => v != null && v !== "") as [string, string][])
            ).toString()}`}
            className="btn-secondary w-full lg:hidden"
          >
            🗺 {t.common.showOnMap}
          </a>
          {offers.length === 0 ? (
            <EmptyState text={t.common.empty} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {offers.map((o) => (
                <OfferCard key={`${o.type}-${o.id}`} offer={o} isFavorite={favIds(o)} isLoggedIn={!!user} />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-2">
            <MapViewClient points={points} center={[origin.lat, origin.lng]} zoom={12} height="calc(100vh - 120px)" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-400">…</div>}>
      <SearchResults sp={searchParams} />
    </Suspense>
  );
}
