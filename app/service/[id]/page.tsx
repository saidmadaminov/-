// Карточка услуги (раздел 14 ТЗ).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { formatPriceRange } from "@/lib/geo";
import ContactButtons from "@/components/ContactButtons";
import ReviewsSection from "@/components/ReviewsSection";
import ReportButton from "@/components/ReportButton";
import StarRating from "@/components/StarRating";
import VerifiedBadge from "@/components/VerifiedBadge";
import FavoriteButton from "@/components/FavoriteButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const s = await prisma.service.findUnique({
    where: { id: params.id },
    include: { specialist: { include: { user: true } }, business: true },
  });
  if (!s) return { title: "Услуга не найдена" };
  return {
    title: `${s.title} — в Бишкеке${s.priceFrom ? `, от ${s.priceFrom} сом` : ""}`,
    description: s.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ServicePage({ params }: { params: { id: string } }) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();

  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specialist: { include: { user: { select: { id: true, name: true } } } },
      business: { select: { id: true, name: true, ownerId: true, phone: true, isVerified: true } },
      category: true,
    },
  });
  if (!service) notFound();

  const agg = await prisma.review.aggregate({
    where: { targetType: "SERVICE", targetId: service.id, status: "PUBLISHED" },
    _avg: { rating: true }, _count: { _all: true },
  });
  const isFav = user
    ? !!(await prisma.favorite.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "SERVICE", targetId: service.id } } }))
    : false;

  const providerName = service.specialist?.user.name ?? service.business?.name ?? "—";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="text-xs text-ink-400">
        <a href="/search?type=SERVICE" className="hover:underline">{t.common.services}</a>
        {service.category && <> · <a href={`/search?type=SERVICE&cat=${service.category.slug}`} className="hover:underline">{service.category.name}</a></>}
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex h-72 items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200 sm:h-96">
            {service.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.images[0].url} alt={service.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl">🛠</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-extrabold leading-tight">{service.title}</h1>
            <FavoriteButton targetType="SERVICE" targetId={service.id} initial={isFav} isLoggedIn={!!user} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {service.isDemo && <span className="badge-demo">{t.common.demo}</span>}
            {service.isOnSite && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">🚗 {t.common.onSite}</span>}
            {service.availability && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">🕐 {service.availability}</span>}
          </div>

          <p className="text-2xl font-extrabold text-brand-700">{formatPriceRange(service.priceFrom, service.priceTo)}</p>
          <StarRating value={agg._avg.rating ?? 0} count={agg._count._all} size="md" />
          {service.description && <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{service.description}</p>}

          <div className="card grid grid-cols-2 gap-3 p-4 text-sm">
            {service.durationMin && <div><p className="text-xs text-ink-400">Длительность</p><p className="font-semibold">~{service.durationMin} мин</p></div>}
            <div><p className="text-xs text-ink-400">Исполнитель</p><p className="font-semibold">{providerName}</p></div>
          </div>

          <ContactButtons
            providerUserId={service.specialist?.userId ?? service.business?.ownerId ?? null}
            phone={service.specialist?.phone ?? service.business?.phone ?? null}
            lat={service.lat}
            lng={service.lng}
            orderTarget={{ type: "SERVICE", id: service.id, title: service.title }}
          />

          {service.specialist && (
            <a href={`/specialist/${service.specialist.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-lg">
              {service.specialist.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.specialist.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-xl">👤</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{service.specialist.user.name}</p>
                <div className="flex items-center gap-2">
                  <StarRating value={service.specialist.ratingAvg} count={service.specialist.reviewCount} />
                  {service.specialist.isVerified && <VerifiedBadge />}
                </div>
              </div>
              <span className="text-xs font-semibold text-brand-600">{t.common.details} →</span>
            </a>
          )}

          <ReportButton targetType="SERVICE" targetId={service.id} />
        </div>
      </div>

      <ReviewsSection targetType="SERVICE" targetId={service.id} isLoggedIn={!!user} />
    </div>
  );
}
