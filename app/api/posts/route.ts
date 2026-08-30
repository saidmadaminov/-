import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { saveBase64Image } from "@/lib/storage";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  title: z.string().trim().max(120).optional(),
  images: z.array(z.string().startsWith("data:image/")).max(6).optional(),
});

async function myOwner(user: { id: string }) {
  const business = await prisma.business.findUnique({ where: { ownerId: user.id } });
  if (business) return { ownerType: "BUSINESS" as const, businessId: business.id, specialistId: null as string | null };
  const specialist = await prisma.specialist.findUnique({ where: { userId: user.id } });
  if (specialist) return { ownerType: "SPECIALIST" as const, businessId: null as string | null, specialistId: specialist.id };
  return null;
}

/** Блог работ (посты) — только для бизнес/специалиста. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const owner = await myOwner(user);
  if (!owner) return NextResponse.json({ error: "Только для бизнес-аккаунтов" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const imageUrls: string[] = [];
  for (const b64 of parsed.data.images ?? []) {
    try { imageUrls.push(await saveBase64Image(b64)); } catch { /* пропускаем битые */ }
  }

  const post = await prisma.post.create({
    data: {
      ownerType: owner.ownerType,
      businessId: owner.businessId,
      specialistId: owner.specialistId,
      title: parsed.data.title,
      text: parsed.data.text,
      images: { create: imageUrls.map((url, i) => ({ url, sortOrder: i })) },
    },
  });
  return NextResponse.json({ ok: true, id: post.id });
}

/** Лента постов владельца (публично). */
export async function GET(req: NextRequest) {
  const ownerType = req.nextUrl.searchParams.get("ownerType");
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerType || !ownerId) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const posts = await prisma.post.findMany({
    where: ownerType === "BUSINESS" ? { businessId: ownerId } : { specialistId: ownerId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ items: posts });
}
