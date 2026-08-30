// Профиль бизнеса (раздел 15 ТЗ) с вкладками-якорями: товары, услуги, отзывы, инфо.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { formatPrice, formatPriceRange } from "@/lib/geo";
import { isOpenNow, DAY_NAMES_RU } from "@/lib/utils";
import ContactButtons from "@/components/ContactButtons";
import ReviewsSection from "@/components/ReviewsSection";
import ReportButton from "@/components/ReportButton";
import StarRating from "@/components/StarRating";
import VerifiedBadge from "@/components/VerifiedBadge";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const b = await prisma.business.findUnique({ where: { id: params.id } });
  if (!b) return { title: "Бизнес не найден" };
  return {
    title: `${b.name} — Бишкек`,
    description: b.description?.slice(0, 160) ?? undefined,
  };
}

export default async function BusinessPage({ params }: { params: { id: string } }) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      hours: true,
      category: true,
      images: true,
    },
  });
  if (!business) notFound();

  await prisma.business.update({ where: { id: business.id }, data: { viewCount: { increment: 1 } } });

  const [products, services, videos] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: business.id, status: { not: "HIDDEN" } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
      take: 12,
    }),
    prisma.service.findMany({ where: { businessId: business.id }, include: { category: true }, take: 10 }),
    prisma.video.findMany({ where: { businessId: business.id, status: "APPROVED" }, take: 6 }),
  ]);

  const open = isOpenNow(business.hours);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Шапка */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-600 to-brand-800" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.name} className="-mt-14 h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-card" />
          ) : (
            <span className="-mt-14 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-ink-100 text-4xl shadow-card">🏪</span>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold">{business.name}</h1>
              {business.isVerified && <VerifiedBadge />}
              {business.isDemo && <span className="badge-demo">{t.common.demo}</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
              {business.category && <span>{business.category.icon} {business.category.name}</span>}
              <StarRating value={business.ratingAvg} count={business.reviewCount} />
              <span>👁 {business.viewCount}</span>
              <span className={open ? "font-semibold text-emerald-600" : "text-ink-400"}>
                ● {open ? t.common.openNow : t.common.closedNow}
              </span>
            </div>
          </div>
          <ContactButtons
            providerUserId={business.ownerId}
            phone={business.phone}
            lat={business.lat}
            lng={business.lng}
            address={business.address}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-8">
          {business.description && (
            <section>
              <h2 className="mb-2 text-lg font-extrabold">О компании</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{business.description}</p>
            </section>
          )}

          {products.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold">{t.common.products} <span className="text-sm text-ink-400">({products.length})</span></h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((p) => (
                  <a key={p.id} href={`/product/${p.id}`} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex h-28 items-center justify-center bg-ink-100">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                      ) : <span className="text-3xl">📦</span>}
                    </div>
                    <div className="p-2.5">
                      <p className="line-clamp-2 min-h-10 text-xs font-semibold">{p.title}</p>
                      <p className="mt-1 text-sm font-extrabold text-brand-700">{formatPrice(p.price)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {services.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold">{t.common.services}</h2>
              <div className="space-y-2">
                {services.map((s) => (
                  <a key={s.id} href={`/service/${s.id}`} className="card flex items-center justify-between gap-3 p-3.5 transition hover:shadow-lg">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{s.title}</p>
                      <p className="text-xs text-ink-400">{s.durationMin ? `~${s.durationMin} мин · ` : ""}{s.isOnSite ? t.common.onSite : "на месте"}</p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-brand-700">{formatPriceRange(s.priceFrom, s.priceTo)}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <ReviewsSection targetType="BUSINESS" targetId={business.id} isLoggedIn={!!user} />
        </div>

        <aside className="space-y-3">
          <div className="card p-4 text-sm">
            <h3 className="mb-2 text-sm font-bold">Информация</h3>
            <p className="mb-1 text-ink-700">📍 {business.address ?? "—"}</p>
            {business.phone && <p className="mb-1 text-ink-700">📞 {business.phone}</p>}
            {business.website && <p className="text-ink-700">🌐 {business.website}</p>}
            <div className="mt-3 border-t border-ink-100 pt-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-400">График</p>
              {business.hours.map((h) => (
                <p key={h.id} className="flex justify-between text-xs">
                  <span>{DAY_NAMES_RU[h.day]}</span>
                  <span className={h.isClosed ? "text-ink-300" : "text-ink-700"}>
                    {h.isClosed ? "закрыто" : `${h.open}–${h.close}`}
                  </span>
                </p>
              ))}
            </div>
          </div>
          <ReportButton targetType="BUSINESS" targetId={business.id} />
        </aside>
      </div>
    </div>
  );
}
