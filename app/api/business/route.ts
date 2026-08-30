import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(3000).optional(),
  categoryId: z.number().int().optional().nullable(),
  address: z.string().trim().max(200).optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  phone: z.string().trim().max(30).optional(),
});

/** Создание бизнес-профиля (раздел 30 ТЗ). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.business) return NextResponse.json({ error: "Бизнес уже создан" }, { status: 409 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const business = await prisma.business.create({
    data: {
      slug: `${slugify(parsed.data.name)}-${Date.now().toString(36)}`,
      ownerId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId ?? null,
      address: parsed.data.address,
      lat: parsed.data.lat ?? user.lat,
      lng: parsed.data.lng ?? user.lng,
      phone: parsed.data.phone ?? user.phone,
      cityId: user.cityId,
    },
  });
  if (user.role === "CUSTOMER") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "BUSINESS" } });
  }
  return NextResponse.json({ ok: true, id: business.id });
}
