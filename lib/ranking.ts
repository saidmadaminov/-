// Ранжирование предложений (раздел 41 ТЗ): рейтинг — не единственный фактор,
// платное продвижение учитывается ограниченно и всегда помечается «Реклама».
import type { UnifiedOffer } from "@/types";

export interface RankingWeights {
  relevance: number;
  distance: number;
  rating: number;
  reviews: number;
  availability: number;
  verification: number;
  price: number;
  promotionBonus: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  relevance: 0.3,
  distance: 0.2,
  rating: 0.2,
  reviews: 0.1,
  availability: 0.08,
  verification: 0.07,
  price: 0.05,
  promotionBonus: 0.1,
};

function normalize(v: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return Math.min(1, Math.max(0, (v - min) / (max - min)));
}

/** Релевантность по совпадению слов запроса в названии/описании/категории. */
export function textRelevance(offer: UnifiedOffer, query?: string | null): number {
  if (!query) return 0.5;
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (q.length === 0) return 0.5;
  const haystack = `${offer.title} ${offer.description ?? ""} ${offer.categoryName ?? ""} ${offer.ownerName ?? ""}`.toLowerCase();
  let hits = 0;
  for (const w of q) if (haystack.includes(w)) hits++;
  const title = offer.title.toLowerCase();
  const titleHits = q.filter((w) => title.includes(w)).length;
  return Math.min(1, hits / q.length * 0.7 + (titleHits > 0 ? 0.3 : 0));
}

export function scoreOffer(
  offer: UnifiedOffer,
  opts: { query?: string | null; maxDistanceKm?: number; weights?: RankingWeights }
): number {
  const w = opts.weights ?? DEFAULT_WEIGHTS;
  const relevance = textRelevance(offer, opts.query);
  const dist = offer.distanceKm;
  const distanceScore =
    dist == null ? 0.4 : 1 - normalize(dist, 0, opts.maxDistanceKm ?? 15);
  const ratingScore = offer.reviewCount > 0 ? offer.rating / 5 : 0.35;
  const reviewsScore = normalize(Math.log1p(offer.reviewCount), 0, Math.log1p(150));
  const availabilityScore = offer.inStock === false ? 0 : 1;
  const verificationScore = offer.verified ? 1 : 0.35;
  let score =
    w.relevance * relevance +
    w.distance * distanceScore +
    w.rating * ratingScore +
    w.reviews * reviewsScore +
    w.availability * availabilityScore +
    w.verification * verificationScore;
  // Соотношение цена/рейтинг для опции value используется отдельно, здесь мягкий бонус.
  if (offer.isPromoted) score += w.promotionBonus;
  return score;
}

export function applySort(offers: UnifiedOffer[], sort: string): UnifiedOffer[] {
  const arr = [...offers];
  switch (sort) {
    case "distance":
      return arr.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    case "price_asc":
      return arr.sort((a, b) => (a.price ?? a.priceFrom ?? 1e12) - (b.price ?? b.priceFrom ?? 1e12));
    case "price_desc":
      return arr.sort((a, b) => (b.price ?? b.priceTo ?? 0) - (a.price ?? a.priceTo ?? 0));
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "value": {
      const value = (o: UnifiedOffer) => {
        const p = o.price ?? o.priceFrom ?? null;
        const r = o.reviewCount > 0 ? o.rating : 3;
        return p ? r / Math.log10(p + 10) : r / 2;
      };
      return arr.sort((a, b) => value(b) - value(a));
    }
    case "in_stock":
      return arr.sort((a, b) => Number(b.inStock ?? true) - Number(a.inStock ?? true) || (b.score ?? 0) - (a.score ?? 0));
    case "open_now":
      return arr.sort((a, b) => Number(b.openNow ?? false) - Number(a.openNow ?? false) || (b.score ?? 0) - (a.score ?? 0));
    case "recommended":
    default:
      return arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
}
