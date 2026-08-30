import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ORDER_TRANSITIONS, ORDER_STATUSES, type OrderStatus } from "@/types";

export const runtime = "nodejs";

/** Смена статуса заказа владельцем (бизнес/специалист) или отмена клиентом. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { status } = await req.json().catch(() => ({}));
  if (!ORDER_STATUSES.includes(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      business: { select: { ownerId: true } },
      specialist: { select: { userId: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = order.business?.ownerId === session.userId || order.specialist?.userId === session.userId;
  const isCustomer = order.customerId === session.userId;
  if (!isOwner && !(isCustomer && status === "CANCELLED")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const current = order.status as OrderStatus;
  if (!ORDER_TRANSITIONS[current].includes(status as OrderStatus)) {
    return NextResponse.json({ error: `недопустимый переход ${current} → ${status}` }, { status: 400 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status } });
  return NextResponse.json({ ok: true });
}
