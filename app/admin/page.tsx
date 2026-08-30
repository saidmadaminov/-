// Админ-панель (раздел 33 ТЗ): обзор, верификация, пользователи, модерация, жалобы.
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { COMPLAINT_REASON_LABELS_RU, type ComplaintReason } from "@/types";
import AdminActions from "@/components/AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/home");

  const [
    counts, verifications, users, reviews, videos, complaints,
  ] = await Promise.all([
    Promise.all([
      prisma.user.count(), prisma.business.count(), prisma.specialist.count(),
      prisma.product.count(), prisma.service.count(), prisma.order.count(),
      prisma.review.count(), prisma.complaint.count({ where: { status: "NEW" } }),
    ]),
    prisma.verification.findMany({
      orderBy: { submittedAt: "desc" },
      include: {
        business: { select: { name: true } },
        specialist: { include: { user: { select: { name: true } } } },
        documents: true,
      },
      take: 30,
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" }, take: 15,
      include: { author: { select: { name: true } } },
    }),
    prisma.video.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" }, take: 15,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const [usersN, businessesN, specialistsN, productsN, servicesN, ordersN, reviewsN, complaintsN] = counts;
  const label = (v: VerificationRow) =>
    v.business?.name ?? v.specialist?.user.name ?? "—";

  type VerificationRow = (typeof verifications)[number];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-xl font-extrabold">🛡 Админ-панель</h1>

      {/* Обзор */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Пользователи", usersN], ["Бизнесы", businessesN], ["Специалисты", specialistsN],
          ["Товары", productsN], ["Услуги", servicesN], ["Заказы", ordersN],
          ["Отзывы", reviewsN], ["Новые жалобы", complaintsN],
        ].map(([l, v]) => (
          <div key={l as string} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-700">{v as number}</p>
            <p className="text-xs text-ink-500">{l as string}</p>
          </div>
        ))}
      </div>

      {/* Верификация */}
      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">Верификация ({verifications.filter((v) => v.status === "PENDING").length} заявок)</h2>
        {verifications.map((v) => (
          <div key={v.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {label(v)} <span className="font-normal text-ink-400">· {v.targetType}</span>
              </p>
              <p className="text-xs text-ink-400">
                {formatDateTime(v.submittedAt)} · документов: {v.documents.length} · статус: {v.status}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {v.documents.map((d) => `${d.docType}: ${d.fileUrl}`).join(" | ")}
              </p>
            </div>
            {v.status === "PENDING" && (
              <div className="flex shrink-0 gap-2">
                <AdminActions action="verify.approve" id={v.id} label="Одобрить" kind="primary" />
                <AdminActions action="verify.reject" id={v.id} label="Отклонить" kind="danger" />
              </div>
            )}
          </div>
        ))}
        {verifications.length === 0 && <p className="card p-4 text-sm text-ink-400">Заявок нет</p>}
      </section>

      {/* Пользователи */}
      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">Пользователи</h2>
        <div className="card divide-y divide-ink-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {u.name} {u.isBlocked && <span className="text-xs text-red-500">(заблокирован)</span>}
                </p>
                <p className="text-xs text-ink-400">{u.phone ?? u.email} · {u.role}</p>
              </div>
              <AdminActions
                action="user.block"
                id={u.id}
                label={u.isBlocked ? "Разблокировать" : "Заблокировать"}
                kind={u.isBlocked ? "primary" : "danger"}
                value={!u.isBlocked}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Модерация отзывов */}
      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">Отзывы</h2>
        <div className="card divide-y divide-ink-100">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  <b>{r.author.name}</b> ★{r.rating} · {r.targetType}
                </p>
                <p className="truncate text-xs text-ink-400">{r.comment}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-semibold ${r.status === "PUBLISHED" ? "text-emerald-600" : "text-ink-400"}`}>
                  {r.status === "PUBLISHED" ? "опубликован" : "скрыт"}
                </span>
                <AdminActions
                  action="review.hide"
                  id={r.id}
                  label={r.status === "PUBLISHED" ? "Скрыть" : "Опубликовать"}
                  kind="secondary"
                  value={r.status === "PUBLISHED" ? "hide" : "publish"}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Модерация видео */}
      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">Видео</h2>
        <div className="card divide-y divide-ink-100">
          {videos.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{v.title ?? v.url}</p>
                <p className="text-xs text-ink-400">{v.status} · {v.views} просмотров</p>
              </div>
              {v.status === "PENDING" && (
                <div className="flex shrink-0 gap-2">
                  <AdminActions action="video.moderate" id={v.id} label="Одобрить" kind="primary" value="APPROVED" />
                  <AdminActions action="video.moderate" id={v.id} label="Отклонить" kind="danger" value="REJECTED" />
                </div>
              )}
            </div>
          ))}
          {videos.length === 0 && <p className="px-4 py-2.5 text-sm text-ink-400">Видео нет</p>}
        </div>
      </section>

      {/* Жалобы */}
      <section className="space-y-2">
        <h2 className="text-lg font-extrabold">Жалобы</h2>
        <div className="card divide-y divide-ink-100">
          {complaints.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {COMPLAINT_REASON_LABELS_RU[c.reason as ComplaintReason] ?? c.reason}
                </p>
                <p className="truncate text-xs text-ink-400">
                  от {c.user.name} · {c.targetType} · {c.description}
                </p>
              </div>
              {c.status === "NEW" && (
                <AdminActions action="complaint.resolve" id={c.id} label="Решено" kind="secondary" />
              )}
            </div>
          ))}
          {complaints.length === 0 && <p className="px-4 py-2.5 text-sm text-ink-400">Жалоб нет</p>}
        </div>
      </section>
    </div>
  );
}
