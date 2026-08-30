// Блок отзывов с критериями (раздел 20 ТЗ) — server component.
import { prisma } from "@/lib/prisma";
import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";
import { formatDate } from "@/lib/utils";
import type { TargetType } from "@/types";

export default async function ReviewsSection({
  targetType,
  targetId,
  isLoggedIn,
}: {
  targetType: TargetType;
  targetId: string;
  isLoggedIn: boolean;
}) {
  const reviews = await prisma.review.findMany({
    where: { targetType, targetId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { author: { select: { name: true, avatarUrl: true } } },
  });

  const crit = (r: { quality?: number | null; accuracy?: number | null; speed?: number | null; communication?: number | null; priceScore?: number | null }) => {
    const rows: [string, number | null | undefined][] = [
      ["Качество", r.quality],
      ["Соответствие", r.accuracy],
      ["Скорость", r.speed],
      ["Общение", r.communication],
      ["Цена", r.priceScore],
    ];
    return rows.filter(([, v]) => v != null).slice(0, 3);
  };

  return (
    <section className="space-y-3" id="reviews">
      <h2 className="text-lg font-extrabold">
        Отзывы <span className="text-sm font-medium text-ink-400">({reviews.length})</span>
      </h2>
      {reviews.length === 0 && (
        <p className="card p-4 text-sm text-ink-400">Пока нет отзывов — станьте первым.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {reviews.map((r) => (
          <article key={r.id} className="card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
                  {r.author.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.author.name}</p>
                  <p className="text-[11px] text-ink-400">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {r.isDemo && <span className="badge-demo">Demo</span>}
                <StarRating value={r.rating} />
              </div>
            </div>
            {r.comment && <p className="text-sm leading-relaxed text-ink-700">{r.comment}</p>}
            {crit(r).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {crit(r).map(([label, v]) => (
                  <span key={label} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-500">
                    {label}: {v}/5
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      <ReviewForm targetType={targetType} targetId={targetId} isLoggedIn={isLoggedIn} />
      <p className="text-[11px] text-ink-300">
        <VerifiedBadge withText={false} /> Отзывы оставляют пользователи платформы; администрация модерирует нарушения правил.
      </p>
    </section>
  );
}
