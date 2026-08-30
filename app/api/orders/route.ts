import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function orderCode(): string {
  return `N-${Math.floor(1000 + Math.random() * 90000)}`;
}

/** Создание заказа (раздел 23 ТЗ). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { targetType, targetId, note } = await req.json().catch(() => ({}));
  if (!targetType || !targetId) return NextResponse.json({ error: "bad request" }, { status: 400 });

  if (targetType === "PRODUCT") {
    const product = await prisma.product.findUnique({ where: { id: targetId }, include: { business: true } });
    if (!product || product.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Товар недоступен" }, { status: 400 });
    }
    const order = await prisma.order.create({
      data: {
        code: orderCode(), customerId: session.userId, targetType: "PRODUCT",
        productId: product.id, businessId: product.businessId,
        totalAmount: product.price, note: note ?? null,
        items: { create: { productId: product.id, quantity: 1, priceAtOrder: product.price } },
      },
    });
    return NextResponse.json({ ok: true, id: order.id, code: order.code });
  }

  if (targetType === "SERVICE") {
    const service = await prisma.service.findUnique({ where: { id: targetId } });
    if (!service) return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    const order = await prisma.order.create({
      data: {
        code: orderCode(), customerId: session.userId, targetType: "SERVICE",
        serviceId: service.id, businessId: service.businessId, specialistId: service.specialistId,
        totalAmount: service.priceFrom ?? null, note: note ?? null,
      },
    });
    return NextResponse.json({ ok: true, id: order.id, code: order.code });
  }

  return NextResponse.json({ error: "bad target" }, { status: 400 });
}

/** Список своих заказов (клиент) или заказов клиентов (бизнес/специалист). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { business: { select: { id: true } }, specialist: { select: { id: true } } },
  });
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isProvider = me.role === "BUSINESS" || me.role === "SPECIALIST";
  const orders = await prisma.order.findMany({
    where: isProvider
      ? { OR: [{ businessId: me.business?.id }, { specialistId: me.specialist?.id }] }
      : { customerId: me.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true, phone: true } },
      product: { select: { title: true, price: true } },
      service: { select: { title: true, priceFrom: true } },
      business: { select: { name: true } },
      specialist: { include: { user: { select: { name: true } } } },
    },
  });
  return NextResponse.json({ items: orders });
}
