"use client";

// Баннер триала/подписки в кабинете.
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export default function TrialBanner({
  plan,
  trialDaysLeft,
}: {
  plan: string;
  trialDaysLeft: number | null;
}) {
  const { t } = useI18n();
  if (plan === "PREMIUM") {
    return (
      <div className="card flex items-center gap-3 border-2 border-emerald-200 p-4 dark:border-emerald-800">
        <span className="text-xl">✓</span>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Премиум активен — все функции доступны</p>
      </div>
    );
  }
  if (trialDaysLeft != null && trialDaysLeft > 0) {
    return (
      <Link href="/pricing" className="card flex items-center justify-between gap-3 border-2 border-brand-200 p-4 transition hover:shadow-lg dark:border-brand-800">
        <p className="text-sm"><b>🎁 {t.common.freeTrial}</b> — {trialDaysLeft} {t.common.daysLeft}</p>
        <span className="text-xs font-semibold text-brand-600">Что даёт подписка →</span>
      </Link>
    );
  }
  return (
    <Link href="/pricing" className="card flex items-center justify-between gap-3 border-2 border-amber-300 p-4 transition hover:shadow-lg dark:border-amber-700">
      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">⚠️ {t.common.trialOver}</p>
      <span className="text-xs font-semibold text-brand-600">Оформить →</span>
    </Link>
  );
}
