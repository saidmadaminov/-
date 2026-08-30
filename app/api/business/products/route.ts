import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productSchema } from "@/lib/validation";

export const runtime = "nodejs";

async function myBusiness(userId: string) {
  return prisma.business.findUnique({ where: { ownerId: userId } });
}

/** Создание товара (раздел 31 ТЗ). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const business = await myBusiness(user.id);
  const specialist = await prisma.specialist.findUnique({ where: { userId: user.id } });
  if (!business && !specialist) {
    return NextResponse.json({ error: "Сначала создайте профиль бизнеса" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "bad request" }, { status: 400 });
  }
  const d = parsed.data;

  const product = await prisma.product.create({
    data: {
      businessId: business?.id ?? null,
      sellerId: business ? null : user.id,
      categoryId: d.categoryId ?? null,
      cityId: user.cityId,
      title: d.title,
      description: d.description,
      price: d.price,
      condition: d.condition,
      status: d.status,
      quantity: d.quantity,
      address: d.address ?? business?.address ?? null,
      lat: d.lat ?? business?.lat ?? user.lat,
      lng: d.lng ?? business?.lng ?? user.lng,
      images: { create: (d.images ?? []).map((url, i) => ({ url, sortOrder: i })) },
    },
  });
  return NextResponse.json({ ok: true, id: product.id });
}

/** Удаление своего товара. */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const business = await myBusiness(user.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || (product.businessId !== business?.id && product.sellerId !== user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
