import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveBase64Image } from "@/lib/storage";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  imageBase64: z.string().startsWith("data:image/"),
  caption: z.string().trim().max(200).optional(),
});

/** Истории живут 24 часа (раздел ТЗ о временных историях). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const business = await prisma.business.findUnique({ where: { ownerId: user.id } });
  const specialist = business ? null : await prisma.specialist.findUnique({ where: { userId: user.id } });
  if (!business && !specialist) {
    return NextResponse.json({ error: "Только для бизнес/специалист-аккаунтов" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  let imageUrl: string;
  try {
    imageUrl = await saveBase64Image(parsed.data.imageBase64);
  } catch {
    return NextResponse.json({ error: "bad image" }, { status: 400 });
  }

  const story = await prisma.story.create({
    data: {
      ownerType: business ? "BUSINESS" : "SPECIALIST",
      businessId: business?.id ?? null,
      specialistId: specialist?.id ?? null,
      imageUrl,
      caption: parsed.data.caption,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({ ok: true, id: story.id });
}

/** Активные (не истёкшие) истории владельца. */
export async function GET(req: NextRequest) {
  const ownerType = req.nextUrl.searchParams.get("ownerType");
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerType || !ownerId) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const stories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(ownerType === "BUSINESS" ? { businessId: ownerId } : { specialistId: ownerId }),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ items: stories });
}
