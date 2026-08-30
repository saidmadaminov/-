import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SubscribeButton from "@/components/SubscribeButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Подписка" };

const FEATURES = [
  ["📦", "Неограниченные товары и услуги", "Публикуйте полный ассортимент — витрина и блог без лимитов"],
  ["📷", "Истории и блог работ", "Показывайте работы в реальном времени, исчезающие истории на 24 часа"],
  ["👁", "Наблюдатели", "Аудитория, которая видит ваши новости и новые товары"],
  ["📈", "Приоритет в поиске", "Ваш профиль выше в результатах рядом с клиентом"],
  ["✓", "Значок «Проверенный»", "После верификации — зелёный пин на карте и доверие клиентов"],
  ["🛡", "Поддержка", "Приоритетная помощь при спорных ситуациях"],
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pricing");

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const trialEndsAt = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const isPremium = sub?.plan === "PREMIUM" && sub.status === "ACTIVE";
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 3600 * 1000)))
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="section-title">⭐ Подписка для бизнеса и специалистов</h1>

      {isPremium ? (
        <div className="card border-2 border-emerald-200 p-5 dark:border-emerald-800">
          <p className="text-lg font-extrabold text-emerald-600">✓ Премиум активен</p>
          <p className="text-sm text-ink-500">Действует до {formatDate(sub?.endsAt)}</p>
        </div>
      ) : (
        <div className={`card p-5 ${trialDaysLeft != null && trialDaysLeft > 0 ? "border-2 border-brand-200 dark:border-brand-800" : "border-2 border-amber-300 dark:border-amber-700"}`}>
          {trialDaysLeft != null && trialDaysLeft > 0 ? (
            <>
              <p className="text-lg font-extrabold">🎁 {user.subscription?.plan === "TRIAL" ? "Бесплатный месяц" : "Пробный период"}</p>
              <p className="text-sm text-ink-500">Осталось {trialDaysLeft} дн. — до {formatDate(trialEndsAt)}. Потом — 990 сом/год.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-extrabold text-amber-600">Бесплатный период закончился</p>
              <p className="text-sm text-ink-500">Оформите подписку, чтобы продолжить пользоваться кабинетом: товары, услуги, истории и блог.</p>
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="card p-4">
            <p className="text-2xl">{icon}</p>
            <p className="mt-1 text-sm font-bold">{title}</p>
            <p className="text-xs text-ink-500">{text}</p>
          </div>
        ))}
      </div>

      {!isPremium && (
        <div className="card p-5 text-center">
          <p className="text-3xl font-extrabold text-brand-700">990 сом<span className="text-base font-medium text-ink-400"> / год</span></p>
          <p className="mt-1 text-xs text-ink-400">Первый месяц бесплатно. Оплата картой или локальными системами (Phase 3) — сейчас активация без списания.</p>
          <div className="mt-4">
            <SubscribeButton />
          </div>
        </div>
      )}
    </div>
  );
}
