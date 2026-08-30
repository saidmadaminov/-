// Единый поиск по товарам/услугам/бизнесам/специалистам (разделы 8–10, 41 ТЗ).
// Используется страницей результатов, картой, API и AI-ассистентом.
import { prisma } from "@/lib/prisma";
import { distanceKm } from "@/lib/geo";
import { applySort, scoreOffer } from "@/lib/ranking";
import { isOpenNow } from "@/lib/utils";
import type { UnifiedOffer, MapPoint, TargetType } from "@/types";

export interface SearchParams {
  q?: string | null;
  type?: TargetType | "ALL" | null;
  categorySlug?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  radiusKm?: number | null;
  ratingMin?: number | null;
  verifiedOnly?: boolean;
  inStockOnly?: boolean;
  condition?: "NEW" | "USED" | null;
  experienceMin?: number | null;
  onSiteOnly?: boolean;
  openNowOnly?: boolean;
  sort?: string;
  origin?: { lat: number; lng: number } | null;
  cityId?: number | null;
  limit?: number;
}

export interface SearchResult {
  offers: UnifiedOffer[];
  total: number;
}

const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // «Активно сейчас» — был онлайн < 5 минут назад
const LOW_RATING_THRESHOLD = 3.5; // ниже — предупреждение на карточке и карте

function isActive(lastSeenAt?: Date | null): boolean {
  return !!lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < ACTIVE_WINDOW_MS;
}
function isLowRating(rating: number, reviewCount: number): boolean {
  return reviewCount >= 3 && rating > 0 && rating < LOW_RATING_THRESHOLD;
}

export async function searchOffers(params: SearchParams): Promise<SearchResult> {
  const limit = Math.min(params.limit ?? 120, 200);
  const q = params.q?.trim() || null;
  const wants = (t: TargetType) =>
    !params.type || params.type === "ALL" || params.type === t;

  const catIds = params.categorySlug
    ? await prisma.category.findMany({
        where: { OR: [{ slug: params.categorySlug }, { parent: { slug: params.categorySlug } }] },
        select: { id: true },
      }).then((rows) => rows.map((r) => r.id))
    : null;

  const contains = q ? q.split(/\s+/).filter((w) => w.length > 2).slice(0, 6) : [];

  // SQL-префильтр по тексту только для Product/Service (совпадающие поля);
  // Business/Specialist фильтруются по тексту в JS (matchesAny).
  const textFilter = () => {
    if (!contains.length) return {};
    const words = contains as string[];
    return {
      OR: words.flatMap((w) => [{ title: { contains: w } }, { description: { contains: w } }]),
    };
  };

  const priceF = (field: string) => {
    const f: Record<string, unknown> = {};
    if (params.minPrice != null) f[field] = { gte: params.minPrice };
    if (params.maxPrice != null) f[field] = { lte: params.maxPrice };
    return f;
  };

  const [products, services, businesses, specialists] = await Promise.all([
    wants("PRODUCT")
      ? prisma.product.findMany({
          where: {
            status: "AVAILABLE",
            ...(catIds?.length ? { categoryId: { in: catIds } } : {}),
            ...priceF("price"),
            ...(params.condition ? { condition: params.condition } : {}),
            ...textFilter(),
          },
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            business: {
              select: {
                id: true, name: true, isVerified: true, lat: true, lng: true,
                owner: { select: { lastSeenAt: true } },
              },
            },
            category: { select: { name: true, icon: true } },
          },
          take: limit,
        }).then((rows) =>
          rows.filter((p) => !contains.length || matchesAny(p.title, p.description, p.category?.name, contains))
        )
      : Promise.resolve([]),
    wants("SERVICE")
      ? prisma.service.findMany({
          where: {
            ...(catIds?.length ? { categoryId: { in: catIds } } : {}),
            ...(params.minPrice != null || params.maxPrice != null
              ? {
                  OR: [
                    ...(params.minPrice != null ? [{ priceFrom: { gte: params.minPrice } }] : []),
                    ...(params.maxPrice != null
                      ? [
                          { priceFrom: { lte: params.maxPrice } },
                          { AND: [{ priceFrom: null }, { priceTo: { lte: params.maxPrice } }] },
                        ]
                      : []),
                  ],
                }
              : {}),
            ...(params.experienceMin != null || params.onSiteOnly
              ? {
                  specialist:
                    params.experienceMin != null && params.onSiteOnly
                      ? { experienceYears: { gte: params.experienceMin }, isOnSite: true }
                      : params.experienceMin != null
                        ? { experienceYears: { gte: params.experienceMin } }
                        : { isOnSite: true },
                }
              : {}),
          },
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            business: {
              select: {
                id: true, name: true, isVerified: true, lat: true, lng: true,
                owner: { select: { lastSeenAt: true } },
              },
            },
            specialist: {
              select: {
                id: true, isVerified: true, lat: true, lng: true,
                user: { select: { name: true, lastSeenAt: true } },
              },
            },
            category: { select: { name: true, icon: true } },
          },
          take: limit,
        }).then((rows) =>
          rows.filter((s) => !contains.length || matchesAny(s.title, s.description, s.category?.name, contains))
        )
      : Promise.resolve([]),
    wants("BUSINESS")
      ? prisma.business.findMany({
          where: {
            ...(catIds?.length ? { categoryId: { in: catIds } } : {}),
          },
          include: {
            hours: true,
            category: { select: { name: true, icon: true, slug: true } },
            owner: { select: { lastSeenAt: true } },
          },
          take: limit,
        }).then((rows) =>
          rows.filter((b) => !contains.length || matchesAny(b.name, b.description, b.category?.name, contains))
        )
      : Promise.resolve([]),
    wants("SPECIALIST")
      ? prisma.specialist.findMany({
          where: {
            ...(catIds?.length ? { categoryId: { in: catIds } } : {}),
            ...(params.experienceMin != null ? { experienceYears: { gte: params.experienceMin } } : {}),
            ...(params.onSiteOnly ? { isOnSite: true } : {}),
          },
          include: {
            user: { select: { name: true, lastSeenAt: true } },
            category: { select: { name: true, icon: true } },
          },
          take: limit,
        }).then((rows) =>
          rows.filter((s) =>
            !contains.length ||
            matchesAny(s.profession, s.description, s.category?.name, s.user?.name, contains)
          )
        )
      : Promise.resolve([]),
  ]);

  const origin = params.origin ?? null;
  const offers: UnifiedOffer[] = [];

  for (const p of products) {
    const lat = p.business?.lat ?? p.lat;
    const lng = p.business?.lng ?? p.lng;
    offers.push({
      id: p.id,
      type: "PRODUCT",
      title: p.title,
      description: p.description,
      price: p.price,
      currency: "KGS",
      image: p.images[0]?.url ?? null,
      categoryName: p.category?.name ?? null,
      categoryIcon: p.category?.icon ?? "📦",
      rating: 0,
      reviewCount: 0,
      verified: !!p.business?.isVerified,
      isPromoted: p.isPromoted,
      isDemo: p.isDemo,
      distanceKm: distanceKm(origin, { lat, lng }),
      lat, lng,
      inStock: p.status === "AVAILABLE",
      ownerId: p.businessId ?? p.sellerId ?? null,
      ownerName: p.business?.name ?? null,
      activeNow: isActive(p.business?.owner?.lastSeenAt),
      createdAt: p.createdAt,
    });
  }
  await fillReviewStats(offers);

  for (const s of services) {
    const lat = s.specialist?.lat ?? s.business?.lat ?? s.lat;
    const lng = s.specialist?.lng ?? s.business?.lng ?? s.lng;
    const ownerName = s.specialist?.user?.name ?? s.business?.name ?? null;
    offers.push({
      id: s.id,
      type: "SERVICE",
      title: s.title,
      description: s.description,
      priceFrom: s.priceFrom,
      priceTo: s.priceTo,
      currency: "KGS",
      image: s.images[0]?.url ?? null,
      categoryName: s.category?.name ?? null,
      categoryIcon: s.category?.icon ?? "🛠",
      rating: 0,
      reviewCount: 0,
      verified: !!(s.specialist?.isVerified || s.business?.isVerified),
      isPromoted: s.isPromoted,
      isDemo: s.isDemo,
      distanceKm: distanceKm(origin, { lat, lng }),
      lat, lng,
      ownerId: s.specialistId ?? s.businessId ?? null,
      ownerName,
      activeNow: isActive(s.specialist?.user?.lastSeenAt ?? s.business?.owner?.lastSeenAt),
      createdAt: s.createdAt,
    });
  }
  await fillReviewStats(offers);

  for (const b of businesses) {
    offers.push({
      id: b.id,
      type: "BUSINESS",
      title: b.name,
      description: b.description,
      currency: "KGS",
      image: b.logoUrl,
      categoryName: b.category?.name ?? null,
      categoryIcon: b.category?.icon ?? "🏪",
      rating: b.ratingAvg,
      reviewCount: b.reviewCount,
      verified: b.isVerified,
      isPromoted: false,
      isDemo: b.isDemo,
      distanceKm: distanceKm(origin, b),
      lat: b.lat ?? null,
      lng: b.lng ?? null,
      openNow: isOpenNow(b.hours),
      ownerId: b.ownerId,
      ownerName: b.name,
      activeNow: isActive(b.owner?.lastSeenAt),
      createdAt: b.createdAt,
    });
  }

  for (const s of specialists) {
    offers.push({
      id: s.id,
      type: "SPECIALIST",
      title: `${s.user?.name ?? ""} — ${s.profession}`,
      description: s.description,
      priceFrom: s.priceFrom,
      priceTo: s.priceTo,
      currency: "KGS",
      image: s.photoUrl,
      categoryName: s.category?.name ?? s.profession,
      categoryIcon: s.category?.icon ?? "👤",
      rating: s.ratingAvg,
      reviewCount: s.reviewCount,
      verified: s.isVerified,
      isPromoted: false,
      isDemo: s.isDemo,
      distanceKm: distanceKm(origin, s),
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      ownerId: s.userId,
      ownerName: s.user?.name ?? null,
      activeNow: isActive(s.user?.lastSeenAt),
      createdAt: s.createdAt,
    });
  }

  // Флаг низкого рейтинга — предупреждение для покупателей (после fillReviewStats)
  for (const o of offers) o.lowRating = isLowRating(o.rating, o.reviewCount);

  // Пост-фильтрация
  let filtered = offers;
  if (params.radiusKm != null && origin) {
    filtered = filtered.filter((o) => o.distanceKm == null || o.distanceKm <= params.radiusKm!);
  }
  if (params.ratingMin != null) filtered = filtered.filter((o) => o.reviewCount === 0 || o.rating >= params.ratingMin!);
  if (params.verifiedOnly) filtered = filtered.filter((o) => o.verified);
  if (params.inStockOnly) filtered = filtered.filter((o) => o.inStock !== false);
  if (params.openNowOnly) filtered = filtered.filter((o) => o.openNow);

  const maxDist = params.radiusKm ?? 15;
  for (const o of filtered) o.score = scoreOffer(o, { query: q, maxDistanceKm: maxDist });

  const sorted = applySort(filtered, params.sort ?? "recommended").slice(0, limit);
  return { offers: sorted, total: filtered.length };
}

function matchesAny(...args: [...(string | null | undefined)[], string[]]): boolean {
  const words = args[args.length - 1] as string[];
  const fields = (args.slice(0, -1) as (string | null | undefined)[]).filter(Boolean) as string[];
  const hay = fields.join(" ").toLowerCase();
  return words.some((w) => hay.includes(w.toLowerCase()));
}

/** Рейтинги товаров/услуг из отзывов (полиморфная связь targetType+targetId). */
async function fillReviewStats(offers: UnifiedOffer[]) {
  const targets = offers.filter((o) => o.type === "PRODUCT" || o.type === "SERVICE");
  if (!targets.length) return;
  const grouped = new Map<string, string[]>();
  for (const t of targets) {
    const arr = grouped.get(t.type) ?? [];
    arr.push(t.id);
    grouped.set(t.type, arr);
  }
  const stats = await prisma.review.groupBy({
    by: ["targetType", "targetId"],
    where: {
      status: "PUBLISHED",
      OR: Array.from(grouped.entries()).map(([type, ids]) => ({
        targetType: type,
        targetId: { in: ids },
      })),
    },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map(stats.map((s) => [`${s.targetType}:${s.targetId}`, s]));
  for (const o of offers) {
    const s = map.get(`${o.type}:${o.id}`);
    if (s && (o.type === "PRODUCT" || o.type === "SERVICE")) {
      o.rating = Math.round((s._avg.rating ?? 0) * 10) / 10;
      o.reviewCount = s._count._all;
    }
  }
}

/** Точки для карты /map и боковой карты в поиске. */
export async function getMapPoints(params: SearchParams): Promise<MapPoint[]> {
  const { offers } = await searchOffers({ ...params, limit: 300, sort: "distance" });
  return offers
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({
      id: o.id,
      type: o.type,
      title: o.title,
      price: o.price ?? null,
      priceFrom: o.priceFrom ?? null,
      rating: o.rating,
      reviewCount: o.reviewCount,
      verified: o.verified,
      lat: o.lat!,
      lng: o.lng!,
      categoryName: o.categoryName ?? null,
      icon: o.categoryIcon ?? "📍",
    }));
}
