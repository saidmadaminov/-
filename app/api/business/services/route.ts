import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serviceSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** Создание услуги (раздел 32 ТЗ) — для бизнеса или специалиста. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const business = await prisma.business.findUnique({ where: { ownerId: user.id } });
  const specialist = await prisma.specialist.findUnique({ where: { userId: user.id } });
  if (!business && !specialist) {
    return NextResponse.json({ error: "Создайте профиль бизнеса или специалиста" }, { status: 400 });
  }

  const parsed = serviceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "bad request" }, { status: 400 });
  }
  const d = parsed.data;

  const service = await prisma.service.create({
    data: {
      businessId: business?.id ?? null,
      specialistId: specialist?.id ?? null,
      categoryId: d.categoryId ?? null,
      cityId: user.cityId,
      title: d.title,
      description: d.description,
      priceFrom: d.priceFrom ?? null,
      priceTo: d.priceTo ?? null,
      durationMin: d.durationMin ?? null,
      isOnSite: d.isOnSite,
      district: d.district ?? specialist?.district ?? null,
      availability: d.availability ?? null,
      lat: specialist?.lat ?? business?.lat ?? user.lat,
      lng: specialist?.lng ?? business?.lng ?? user.lng,
      images: { create: (d.images ?? []).map((url, i) => ({ url, sortOrder: i })) },
    },
  });
  return NextResponse.json({ ok: true, id: service.id });
}
