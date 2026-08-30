// Карточка товара (раздел 13 ТЗ).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { distanceKm, formatPrice } from "@/lib/geo";
import ContactButtons from "@/components/ContactButtons";
import FavoriteButton from "@/components/FavoriteButton";
import ReviewsSection from "@/components/ReviewsSection";
import ReportButton from "@/components/ReportButton";
import StarRating from "@/components/StarRating";
import VerifiedBadge from "@/components/VerifiedBadge";
import { BISHKEK_CENTER } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await prisma.product.findUnique({ where: { id: params.id }, include: { business: true } });
  if (!p) return { title: "Товар не найден" };
  return {
    title: `${p.title} — ${formatPrice(p.price)} в Бишкеке`,
    description: p.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      business: { include: { category: true } },
      category: true,
      videos: true,
    },
  });
  if (!product || product.status === "HIDDEN") notFound();

  await prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } });

  const origin = user?.lat != null && user?.lng != null ? { lat: user.lat, lng: user.lng } : BISHKEK_CENTER;
  const dist = distanceKm(origin, product.lat != null ? product : product.business);
  const isFav = user
    ? !!(await prisma.favorite.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "PRODUCT", targetId: product.id } } }))
    : false;

  const agg = await prisma.review.aggregate({
    where: { targetType: "PRODUCT", targetId: product.id, status: "PUBLISHED" },
    _avg: { rating: true }, _count: { _all: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="text-xs text-ink-400">
        <a href="/search" className="hover:underline">{t.nav.search}</a>
        {product.category && <> · <a href={`/search?cat=${product.category.slug}`} className="hover:underline">{product.category.name}</a></>}
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex h-72 items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200 sm:h-96">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0].url} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl">📦</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-2 no-scrollbar">
              {product.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-extrabold leading-tight">{product.title}</h1>
            <FavoriteButton targetType="PRODUCT" targetId={product.id} initial={isFav} isLoggedIn={!!user} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {product.isDemo && <span className="badge-demo">{t.common.demo}</span>}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {product.status === "AVAILABLE" ? t.common.inStock : t.common.outOfStock}
            </span>
            <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
              {product.condition === "NEW" ? t.common.new : t.common.used}
            </span>
            {dist != null && <span className="text-xs text-ink-500">📍 {t.common.distance}: {dist.toFixed(1)} км</span>}
          </div>

          <p className="text-3xl font-extrabold text-brand-700">{formatPrice(product.price)}</p>

          <StarRating value={agg._avg.rating ?? 0} count={agg._count._all} size="md" />

          {product.description && <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{product.description}</p>}

          <div className="card grid grid-cols-2 gap-3 p-4 text-sm">
            <div><p className="text-xs text-ink-400">Количество</p><p className="font-semibold">{product.quantity} шт.</p></div>
            <div><p className="text-xs text-ink-400">Адрес</p><p className="font-semibold">{product.address || product.business?.address || "—"}</p></div>
          </div>

          <ContactButtons
            providerUserId={product.business?.ownerId ?? product.sellerId ?? null}
            phone={product.business?.phone ?? null}
            lat={product.lat ?? product.business?.lat ?? null}
            lng={product.lng ?? product.business?.lng ?? null}
            address={product.address ?? product.business?.address ?? null}
            orderTarget={{ type: "PRODUCT", id: product.id, title: product.title }}
          />

          {product.business && (
            <a href={`/business/${product.business.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-lg">
              {product.business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.business.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-xl">🏪</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{product.business.name}</p>
                <div className="flex items-center gap-2">
                  <StarRating value={product.business.ratingAvg} count={product.business.reviewCount} />
                  {product.business.isVerified && <VerifiedBadge />}
                </div>
              </div>
              <span className="text-xs font-semibold text-brand-600">{t.common.details} →</span>
            </a>
          )}

          <ReportButton targetType="PRODUCT" targetId={product.id} />
        </div>
      </div>

      <ReviewsSection targetType="PRODUCT" targetId={product.id} isLoggedIn={!!user} />
    </div>
  );
}
