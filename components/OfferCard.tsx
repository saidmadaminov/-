"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { formatDistance, formatPrice, formatPriceRange } from "@/lib/geo";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";
import FavoriteButton from "./FavoriteButton";
import type { UnifiedOffer } from "@/types";

export function offerHref(o: Pick<UnifiedOffer, "type" | "id">): string {
  switch (o.type) {
    case "PRODUCT": return `/product/${o.id}`;
    case "SERVICE": return `/service/${o.id}`;
    case "BUSINESS": return `/business/${o.id}`;
    case "SPECIALIST": return `/specialist/${o.id}`;
  }
}

export default function OfferCard({
  offer,
  isFavorite = false,
  isLoggedIn = false,
  compact = false,
}: {
  offer: UnifiedOffer;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const priceLabel =
    offer.type === "PRODUCT"
      ? formatPrice(offer.price)
      : offer.type === "SERVICE" || offer.type === "SPECIALIST"
        ? formatPriceRange(offer.priceFrom ?? offer.price, offer.priceTo)
        : null;

  return (
    <Link href={offerHref(offer)} className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <div className={`flex items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200 ${compact ? "h-28" : "h-40"}`}>
          {offer.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offer.image} alt={offer.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="text-5xl">{offer.categoryIcon ?? "📍"}</span>
          )}
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {offer.isPromoted && <span className="badge-ad">{t.common.ad}</span>}
          {offer.isDemo && <span className="badge-demo">{t.common.demo}</span>}
          {offer.lowRating && <span className="badge-ad" title={t.common.lowRating}>⚠</span>}
        </div>
        {offer.activeNow && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur" title={t.common.activeNow}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {t.common.activeNow}
          </span>
        )}
        <div className="absolute right-2 top-2">
          <FavoriteButton targetType={offer.type} targetId={offer.id} initial={isFavorite} isLoggedIn={isLoggedIn} />
        </div>
      </div>
      <div className="space-y-1.5 p-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
          {offer.title}
        </p>
        {priceLabel && <p className="text-base font-extrabold text-brand-700">{priceLabel}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <StarRating value={offer.rating} count={offer.reviewCount} />
          {offer.distanceKm != null && <span>📍 {formatDistance(offer.distanceKm)}</span>}
          {offer.inStock === false && <span className="text-red-500">{t.common.outOfStock}</span>}
          {offer.openNow === true && <span className="text-emerald-600">● {t.common.openNow}</span>}
          {offer.openNow === false && <span className="text-ink-400">● {t.common.closedNow}</span>}
        </div>
        <div className="flex items-center gap-2">
          {offer.verified && <VerifiedBadge />}
          {offer.categoryName && (
            <span className="truncate text-[11px] text-ink-400">
              {offer.categoryIcon} {offer.categoryName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
