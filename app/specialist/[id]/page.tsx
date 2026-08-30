// Профиль специалиста (раздел 16 ТЗ).
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
import { formatPrice } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const s = await prisma.specialist.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!s) return { title: "Специалист не найден" };
  return {
    title: `${s.user.name} — ${s.profession}, Бишкек`,
    description: s.description?.slice(0, 160) ?? undefined,
  };
}

export default async function SpecialistPage({ params }: { params: { id: string } }) {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);
  const user = await getCurrentUser();

  const spec = await prisma.specialist.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      category: true,
      portfolio: true,
    },
  });
  if (!spec) notFound();

  await prisma.specialist.update({ where: { id: spec.id }, data: { viewCount: { increment: 1 } } });

  const [services, reviewsAgg] = await Promise.all([
    prisma.service.findMany({ where: { specialistId: spec.id }, include: { category: true } }),
    prisma.review.aggregate({
      where: { targetType: "SPECIALIST", targetId: spec.id, status: "PUBLISHED" },
      _avg: { rating: true }, _count: { _all: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {spec.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={spec.photoUrl} alt={spec.user.name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ink-100 text-4xl">👤</span>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold">{spec.user.name}</h1>
              {spec.isVerified && <VerifiedBadge />}
              {spec.isDemo && <span className="badge-demo">{t.common.demo}</span>}
            </div>
            <p className="text-sm font-semibold text-brand-700">{spec.profession}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
              <StarRating value={reviewsAgg._avg.rating ?? spec.ratingAvg} count={reviewsAgg._count._all} />
              <span>💼 {spec.experienceYears} {t.common.experience}</span>
              {spec.district && <span>📍 {spec.district}</span>}
              <span>👁 {spec.viewCount}</span>
            </div>
          </div>
          <ContactButtons
            providerUserId={spec.userId}
            phone={spec.phone ?? spec.user.phone}
            lat={spec.lat}
            lng={spec.lng}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-8">
          {spec.description && (
            <section>
              <h2 className="mb-2 text-lg font-extrabold">О себе</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{spec.description}</p>
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

          {spec.portfolio.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold">Портфолио</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {spec.portfolio.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt={img.caption ?? ""} className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            </section>
          )}

          <ReviewsSection targetType="SPECIALIST" targetId={spec.id} isLoggedIn={!!user} />
        </div>

        <aside className="space-y-3">
          <div className="card p-4 text-sm">
            <h3 className="mb-2 text-sm font-bold">Информация</h3>
            {spec.priceFrom != null && (
              <p className="mb-1">💰 {formatPrice(spec.priceFrom)}{spec.priceTo ? ` – ${formatPrice(spec.priceTo)}` : " и выше"}</p>
            )}
            {spec.availability && <p className="mb-1">🕐 {spec.availability}</p>}
            <p>{spec.isOnSite ? `🚗 ${t.common.onSite}` : "🏢 Работа на месте"}</p>
          </div>
          <ReportButton targetType="SPECIALIST" targetId={spec.id} />
        </aside>
      </div>
    </div>
  );
}
