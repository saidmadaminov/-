// Страница карты /map (раздел 11 ТЗ).
import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { getMapPoints } from "@/services/search";
import { BISHKEK_CENTER } from "@/lib/geo";
import MapViewClient from "@/components/MapViewClient";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MapPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; cat?: string };
}) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();
  const center = user?.lat != null && user?.lng != null ? { lat: user.lat, lng: user.lng } : BISHKEK_CENTER;

  const points = await getMapPoints({
    q: searchParams.q || null,
    type: (searchParams.type || null) as never,
    categorySlug: searchParams.cat || null,
    origin: center,
    limit: 300,
  });

  const typeTabs = [
    { key: "", label: t.common.all },
    { key: "PRODUCT", label: t.common.products },
    { key: "SERVICE", label: t.common.services },
    { key: "SPECIALIST", label: t.common.specialists },
    { key: "BUSINESS", label: t.common.businesses },
  ];
  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams as Record<string, string>);
    if (value) next.set(key, value);
    else next.delete(key);
    return `/map?${next.toString()}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold">🗺 {t.nav.map} · {t.common.bishkek}</h1>
        <p className="text-xs text-ink-400">{points.length} {t.common.results}</p>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {typeTabs.map((tab) => (
          <Link key={tab.key} href={withParam("type", tab.key)} className={cn("chip !py-1.5 text-xs", (searchParams.type || "") === tab.key && "chip-active")}>
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="card overflow-hidden p-1">
        <MapViewClient points={points} center={[center.lat, center.lng]} zoom={12} height="calc(100vh - 220px)" />
      </div>
      <p className="text-center text-[11px] text-ink-400">
        © OpenStreetMap — зелёные пины: проверенные профили
      </p>
    </div>
  );
}
