// Кабинет бизнеса (раздел 30 ТЗ): статистика, товары/услуги, верификация.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPriceRange } from "@/lib/geo";
import DashboardCreateForms from "@/components/DashboardCreateForms";
import VerificationForm from "@/components/VerificationForm";
import TrialBanner from "@/components/TrialBanner";
import ProductEditor from "@/components/ProductEditor";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business-dashboard");

  const specialist = await prisma.specialist.findUnique({ where: { userId: user.id } });
  let business = await prisma.business.findUnique({ where: { ownerId: user.id }, include: { category: true } });
  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (24 * 3600 * 1000)))
    : null;

  // Специалист без бизнеса всё равно получает кабинет (услуги/верификация)
  if (!business && !specialist) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <DashboardCreateForms needBusiness />
      </div>
    );
  }

  const [products, services, orders, messagesCount, convCount] = await Promise.all([
    business
      ? prisma.product.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" }, include: { images: { orderBy: { sortOrder: "asc" } } } })
      : Promise.resolve([]),
    business
      ? prisma.service.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } })
      : prisma.service.findMany({ where: { specialistId: specialist!.id }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({
      where: { OR: [{ businessId: business?.id }, { specialistId: specialist?.id }] },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { customer: { select: { name: true } }, product: { select: { title: true } }, service: { select: { title: true } } },
    }),
    prisma.message.count({
      where: { conversation: { providerUserId: user.id }, readAt: null },
    }),
    prisma.conversation.count({ where: { providerUserId: user.id } }),
  ]);

  const productViews = products.reduce((s, p) => s + p.viewCount, 0);
  const favoritesCount = business
    ? await prisma.favorite.count({ where: { OR: [{ targetType: "BUSINESS", targetId: business.id }] } })
    : 0;
  const profileViews = business?.viewCount ?? specialist?.viewCount ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">
          {business ? `🏪 ${business.name}` : "👷 Кабинет специалиста"}
        </h1>
        <div className="flex gap-2">
          {business && <Link href={`/business/${business.id}`} className="btn-secondary !py-1.5 text-xs">Публичная страница →</Link>}
          {specialist && <Link href={`/specialist/${specialist.id}`} className="btn-secondary !py-1.5 text-xs">Мой профиль →</Link>}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Просмотры профиля", profileViews],
          ["Просмотры товаров", productViews],
          ["Заказы", orders.length],
          ["Диалоги", convCount],
          ["Непрочитанные", messagesCount],
          ["В избранном", favoritesCount],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-3.5 text-center">
            <p className="text-xl font-extrabold text-brand-700">{value as number}</p>
            <p className="text-[11px] leading-tight text-ink-500">{label as string}</p>
          </div>
        ))}
      </div>

      {/* Подписка */}
      {(business || specialist) && (
        <TrialBanner plan={subscription?.plan ?? "NONE"} trialDaysLeft={trialDaysLeft} />
      )}

      {/* Статус верификации */}
      {(business || specialist) && (
        <VerificationForm
          status={(business ?? specialist)!.verificationStatus}
          targetType={business ? "BUSINESS" : "SPECIALIST"}
        />
      )}

      {/* Товары */}
      {business && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">Товары ({products.length})</h2>
          <div className="space-y-2">
            {products.map((p) => (
              <ProductEditor
                key={p.id}
                product={{
                  id: p.id, title: p.title, price: p.price, description: p.description,
                  quantity: p.quantity, status: p.status, condition: p.condition,
                  images: p.images.map((i) => ({ id: i.id, url: i.url })),
                }}
              />
            ))}
            {products.length === 0 && <p className="card p-4 text-sm text-ink-400">Товаров пока нет</p>}
          </div>
        </section>
      )}

      {/* Услуги */}
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Услуги ({services.length})</h2>
        <div className="space-y-2">
          {services.map((s) => (
            <Link key={s.id} href={`/service/${s.id}`} className="card block p-3.5 transition hover:shadow-lg">
              <p className="text-sm font-bold">{s.title}</p>
              <p className="text-xs text-ink-400">{formatPriceRange(s.priceFrom, s.priceTo)} · 👁 {s.viewCount}</p>
            </Link>
          ))}
          {services.length === 0 && <p className="card p-4 text-sm text-ink-400">Услуг пока нет</p>}
        </div>
      </section>

      {/* Последние заказы */}
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Последние заказы</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-bold">№{o.code} · {o.product?.title ?? o.service?.title}</p>
                <p className="text-xs text-ink-400">{o.customer.name} · {o.status}</p>
              </div>
              <Link href="/orders" className="btn-ghost">Управлять →</Link>
            </div>
          ))}
          {orders.length === 0 && <p className="card p-4 text-sm text-ink-400">Заказов пока нет</p>}
        </div>
      </section>

      <DashboardCreateForms needBusiness={!business && !!specialist} />
    </div>
  );
}
