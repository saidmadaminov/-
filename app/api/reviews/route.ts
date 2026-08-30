import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const OWNER_MODEL = {
  BUSINESS: prisma.business,
  SPECIALIST: prisma.specialist,
} as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`review:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "too many" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const data = parsed.data;

  // Один отзыв на объект от пользователя (уникальность в схеме)
  const dup = await prisma.review.findUnique({
    where: { authorId_targetType_targetId: { authorId: session.userId, targetType: data.targetType, targetId: data.targetId } },
  });
  if (dup) return NextResponse.json({ error: "already" }, { status: 409 });

  await prisma.review.create({
    data: {
      authorId: session.userId,
      targetType: data.targetType,
      targetId: data.targetId,
      rating: data.rating,
      quality: data.quality, accuracy: data.accuracy, speed: data.speed,
      communication: data.communication, priceScore: data.priceScore,
      comment: data.comment,
    },
  });

  // Пересчёт денормализованного рейтинга бизнесов/специалистов
  if (data.targetType === "BUSINESS" || data.targetType === "SPECIALIST") {
    const agg = await prisma.review.aggregate({
      where: { targetType: data.targetType, targetId: data.targetId, status: "PUBLISHED" },
      _avg: { rating: true }, _count: { _all: true },
    });
    await (OWNER_MODEL[data.targetType] as typeof prisma.business).update({
      where: { id: data.targetId },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count._all,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
