// Landing page (раздел 57 ТЗ — сообщения бренда).
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";
import { cookies } from "next/headers";
import SearchBar from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  const t = getDictionary(locale);
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  const examples = [
    "Сантехник рядом со мной",
    "iPhone до 90000 сом",
    "Перевезти диван сегодня",
    "Шиномонтаж рядом",
    "Ремонт стиральных машин",
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-center text-white sm:py-20">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-semibold tracking-wide">
            📍 {t.common.bishkek} · MVP
          </p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{t.home.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-brand-100 sm:text-base">{t.home.heroSubtitle}</p>
          <div className="mx-auto mt-7 max-w-xl">
            <SearchBar big />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-xs text-brand-200">{t.home.tryExamples}</span>
            {examples.map((e) => (
              <Link key={e} href={`/search?q=${encodeURIComponent(e)}`} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20">
                {e}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold">{t.home.popularCategories}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/search?cat=${c.slug}`}
              className="card flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="text-4xl">{c.icon}</span>
              <span className="text-sm font-semibold">{(locale === "ky" && c.nameKy) || c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-extrabold">{t.home.howItWorks}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", t.home.step1, t.home.step1d],
            ["2", t.home.step2, t.home.step2d],
            ["3", t.home.step3, t.home.step3d],
          ].map(([n, title, desc]) => (
            <div key={n} className="card p-5">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{n}</span>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs text-ink-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Для бизнеса */}
      <section className="mt-12 rounded-3xl bg-ink-900 p-8 text-center text-white sm:p-12">
        <h2 className="text-2xl font-extrabold">{t.home.forBusiness}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-300">{t.home.forBusinessText}</p>
        <p className="mt-2 text-xs text-ink-400">{t.home.noConnections}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary !px-6 !py-3">{t.nav.register}</Link>
          <Link href="/search" className="btn-secondary !border-ink-600 !bg-transparent !text-white !px-6 !py-3">
            {t.nav.search}
          </Link>
        </div>
      </section>

      {/* Демо-данные */}
      <p className="mt-8 text-center text-xs text-ink-400">
        Демо-версия с примерами данных (помечены «Demo data»). Все demo-отзывы и верификации — иллюстративные.
      </p>
    </div>
  );
}
