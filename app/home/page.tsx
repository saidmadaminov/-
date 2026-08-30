// Главная страница приложения (раздел 7 ТЗ).
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { searchOffers } from "@/services/search";
import { BISHKEK_CENTER } from "@/lib/geo";
import SearchBar from "@/components/SearchBar";
import LocationChip from "@/components/LocationChip";
import OfferCard from "@/components/OfferCard";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_TABS = [
  { key: "", labelKey: "all" },
  { key: "PRODUCT", labelKey: "products" },
  { key: "SERVICE", labelKey: "services" },
  { key: "SPECIALIST", labelKey: "specialists" },
  { key: "BUSINESS", labelKey: "businesses" },
] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();
  const origin = user?.lat != null && user?.lng != null ? { lat: user.lat, lng: user.lng } : BISHKEK_CENTER;
  const type = (TYPE_TABS.find((x) => x.key === searchParams.type)?.key || "") as string;

  const [{ offers }, favorites, categories] = await Promise.all([
    searchOffers({
      type: (type || null) as never,
      origin,
      sort: "recommended",
      limit: 24,
    }),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id } }).then((rows) => new Set(rows.map((f) => `${f.targetType}:${f.targetId}`)))
      : Promise.resolve(new Set<string>()),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" } }),
  ]);

  const favIds = (o: { type: string; id: string }) => favorites.has(`${o.type}:${o.id}`);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SearchBar />
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <LocationChip city={user?.city?.name ?? t.common.bishkek} hasCoords={user?.lat != null} />
          {TYPE_TABS.map((tab) => (
            <Link
              key={tab.labelKey}
              href={tab.key ? `/home?type=${tab.key}` : "/home"}
              className={cn("chip", searchParams.type === tab.key && tab.key !== "" && "chip-active")}
            >
              {t.common[tab.labelKey]}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <Link key={c.id} href={`/search?cat=${c.slug}`} className="chip !py-1 text-xs">
              {c.icon} {c.name}
            </Link>
          ))}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">📍 {t.common.nearby}</h2>
          <Link href="/search" className="text-xs font-semibold text-brand-600 hover:underline">
            {t.nav.search} →
          </Link>
        </div>
        {offers.length === 0 ? (
          <EmptyState text={t.common.empty} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {offers.map((o) => (
              <OfferCard
                key={`${o.type}-${o.id}`}
                offer={o}
                isFavorite={favIds(o)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
