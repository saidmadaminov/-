import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ subscription: sub });
}

/** Активация подписки (в MVP — заглушка; Phase 3 подключит платёжные системы). */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { plan: "PREMIUM", status: "ACTIVE", endsAt: new Date(Date.now() + 365 * 24 * 3600 * 1000) },
    create: { userId: user.id, plan: "PREMIUM", status: "ACTIVE" },
  });
  await prisma.payment.create({
    data: { userId: user.id, amount: 990, currency: "KGS", method: "MOCK", status: "COMPLETED" },
  }).catch(() => null);
  return NextResponse.json({ ok: true, plan: "PREMIUM" });
}
