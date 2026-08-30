// Моё избранное (раздел 21 ТЗ).
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchOffers } from "@/services/search";
import { BISHKEK_CENTER } from "@/lib/geo";
import OfferCard from "@/components/OfferCard";
import EmptyState from "@/components/EmptyState";
import type { TargetType, UnifiedOffer } from "@/types";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Загружаем карточки избранных объектов единым поиском по id-наборам
  const byType = new Map<TargetType, string[]>();
  for (const f of favorites) {
    const arr = byType.get(f.targetType as TargetType) ?? [];
    arr.push(f.targetId);
    byType.set(f.targetType as TargetType, arr);
  }

  const favSet = new Set(favorites.map((f) => `${f.targetType}:${f.targetId}`));
  const offers: UnifiedOffer[] = [];
  for (const [type, ids] of byType) {
    const { offers: found } = await searchOffers({ type, origin: BISHKEK_CENTER, limit: 200 });
    offers.push(...found.filter((o) => ids.includes(o.id)));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-xl font-extrabold">❤ Избранное</h1>
      {offers.length === 0 ? (
        <EmptyState text="Здесь появятся сохранённые товары, услуги и профили" icon="❤" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {offers.map((o) => (
            <OfferCard key={`${o.type}-${o.id}`} offer={o} isFavorite={favSet.has(`${o.type}:${o.id}`)} isLoggedIn />
          ))}
        </div>
      )}
    </div>
  );
}
