import { cookies } from "next/headers";
import { getDictionary, LOCALE_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Правила платформы" };

export default function RulesPage() {
  const t = getDictionary(cookies().get(LOCALE_COOKIE)?.value);

  const sellerRules = [
    ["Пишите правду", "Реальные цены, реальное наличие, реальные фото работ. Не выставляйте то, чего нет."],
    ["Не обманывайте искателей", "За обман: предупреждение → понижение рейтинга и значок «невысокий рейтинг» на карте → в крайнем случае блокировка аккаунта."],
    ["Отвечайте быстро", "Индикатор «Активно сейчас» показывает искателям, что вы онлайн и готовы помочь."],
    ["Ведите блог честно", "Работы и истории должны показывать реальные результаты — это ваша репутация."],
  ];

  const seekerRules = [
    ["Уважайте время исполнителей", "Договаривайтесь честно, не срывайте договорённости без причины."],
    ["Оставляйте честные отзывы", "Отзыв — инструмент доверия. Завышенные или заниженные «из мести» рейтинги вводят в заблуждение других людей."],
    ["Не нарушайте закон", "Запрещены попытки мошенничества с любой стороны."],
  ];

  const sanctions = [
    "🟡 Предупреждение от модерации",
    "🟠 Понижение видимости в поиске + значок «невысокий рейтинг»",
    "🔴 Заморозка верификации",
    "⛔ Блокировка аккаунта при повторном обмане",
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="section-title">📜 {t.common.rules}</h1>

      <p className="card p-5 text-sm leading-relaxed">
        Naydi работает только на доверии. Платформа проверяет профили (значок
        <b> ✓ Проверенный</b>), собирает честные отзывы и следит за жалобами.
        Значок проверки — это подтверждение данных профиля, но не гарантия результата
        каждой сделки. Поэтому правила действуют в обе стороны.
      </p>

      <section className="card p-5">
        <h2 className="mb-3 text-base font-bold">🏪 Для бизнеса и специалистов</h2>
        <ul className="space-y-2.5">
          {sellerRules.map(([title, text]) => (
            <li key={title} className="text-sm"><b>{title}.</b> <span className="text-ink-600 dark:text-ink-300">{text}</span></li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-base font-bold">🔍 Для тех, кто ищет</h2>
        <ul className="space-y-2.5">
          {seekerRules.map(([title, text]) => (
            <li key={title} className="text-sm"><b>{title}.</b> <span className="text-ink-600 dark:text-ink-300">{text}</span></li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-base font-bold">⚖️ Меры при нарушении</h2>
        <ul className="space-y-2">
          {sanctions.map((s) => <li key={s} className="text-sm">{s}</li>)}
        </ul>
        <p className="mt-3 text-xs text-ink-400">Жалобу на нарушение может подать любой пользователь — кнопка «Пожаловаться» на карточках и профилях.</p>
      </section>
    </div>
  );
}
