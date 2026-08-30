import { NextRequest, NextResponse } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";
import { aiParseQuery } from "@/lib/ai";
import { searchOffers } from "@/services/search";
import { scoreOffer } from "@/lib/ranking";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { parseGeoCookie, LOCATION_COOKIE } from "@/lib/location-cookie";
import { BISHKEK_CENTER } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TYPE_MAP: Record<string, "PRODUCT" | "SERVICE" | "SPECIALIST" | "BUSINESS" | undefined> = {
  PRODUCT: "PRODUCT", SERVICE: "SERVICE", SPECIALIST: "SPECIALIST", BUSINESS: "BUSINESS",
};

/** AI-поиск (раздел 25 ТЗ): разбор запроса → внутренний поиск → объяснение на реальных данных. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`ai:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "too many" }, { status: 429 });
  }

  const { query } = await req.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < 2) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { parsed, usedLlm } = await aiParseQuery(query.slice(0, 500));

  const user = await getCurrentUser();
  const geoCookie = parseGeoCookie(req.cookies.get(LOCATION_COOKIE)?.value);
  const origin =
    user?.lat != null && user?.lng != null
      ? { lat: user.lat, lng: user.lng }
      : geoCookie ?? BISHKEK_CENTER;

  // Если категория определена — ищем по категории (слова запроса часто не
  // совпадают дословно: «перевезти» vs «перевозка»).
  const q = parsed.categorySlug ? null : parsed.keywords.join(" ") || null;
  const baseParams = {
    q,
    categorySlug: parsed.categorySlug ?? null,
    maxPrice: parsed.maxPrice ?? null,
    minPrice: parsed.minPrice ?? null,
    origin,
    sort: parsed.nearby ? "distance" : "recommended",
    limit: 12,
  };

  let { offers } = await searchOffers({
    ...baseParams,
    type: (parsed.type && TYPE_MAP[parsed.type]) ?? "ALL",
  });

  // Фолбэк: если узкий тип дал мало вариантов — расширяем до всех типов
  // (например, «сантехник» → услуги сантехнических компаний).
  if (offers.length < 3 && parsed.type) {
    const wide = await searchOffers({ ...baseParams, type: "ALL" });
    const seen = new Set(offers.map((o) => `${o.type}:${o.id}`));
    for (const o of wide.offers) {
      if (!seen.has(`${o.type}:${o.id}`)) offers.push(o);
      if (offers.length >= 12) break;
    }
  }

  // История поиска (раздел 29 ТЗ)
  await prisma.searchHistory.create({ data: { userId: session.userId, query: query.slice(0, 200) } }).catch(() => null);

  // Лучший выбор — по комплексному скору, а не только рейтинг (раздел 26 ТЗ)
  let best = null;
  if (offers.length) {
    best = [...offers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  }

  const parts: string[] = [];
  if (parsed.subcategorySlug) parts.push("категория: " + parsed.subcategorySlug);
  if (parsed.maxPrice) parts.push(`бюджет до ${parsed.maxPrice} сом`);
  if (parsed.nearby) parts.push("рядом с вами");
  if (parsed.today) parts.push("желательно сегодня");
  const summary = parts.length ? `Понял запрос: ${parts.join(", ")}. ` : "Ищу подходящие предложения. ";

  const explanation =
    offers.length === 0
      ? summary + "К сожалению, подходящих предложений в базе не нашлось. Попробуйте изменить формулировку."
      : summary + `Нашёл ${offers.length} подходящих вариантов${best ? " — лучшее сочетание цены, расстояния и рейтинга показал сверху" : ""}.`;

  return NextResponse.json({
    explanation,
    offers,
    best,
    usedLlm,
  });
}
