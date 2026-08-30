import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Слишком много попыток, попробуйте позже" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Некорректные данные" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [...(data.phone ? [{ phone: data.phone }] : []), ...(data.email ? [{ email: data.email }] : [])] },
  });
  if (existing) {
    return NextResponse.json({ error: "Пользователь с такими данными уже существует" }, { status: 409 });
  }

  const defaultCity = await prisma.city.findFirst({ orderBy: { id: "asc" } });
  const user = await prisma.user.create({
    data: {
      phone: data.phone,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      name: data.name,
      role: data.role,
      locale: data.locale,
      cityId: data.cityId ?? defaultCity?.id ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      profile: { create: {} },
      // Заготовки профилей бизнесу/специалисту — дополнят в кабинетах
      ...(data.role === "SPECIALIST"
        ? {
            specialist: {
              create: {
                slug: `${slugify(data.name)}-${Date.now().toString(36)}`,
                profession: data.profession || "Специалист",
                lat: data.lat ?? null,
                lng: data.lng ?? null,
              },
            },
          }
        : {}),
      ...(data.role === "SPECIALIST" || data.role === "BUSINESS"
        ? {
            subscription: {
              create: {
                plan: "TRIAL",
                trialEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
                status: "ACTIVE",
              },
            },
          }
        : {}),
    },
  });

  const token = await createSessionToken({ userId: user.id, role: user.role as never, name: user.name });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
