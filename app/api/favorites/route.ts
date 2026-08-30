import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { TargetType } from "@/types";

export const runtime = "nodejs";

/** Переключение избранного (раздел 21 ТЗ). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { targetType, targetId } = await req.json().catch(() => ({}));
  if (!targetType || !targetId) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const key = { userId: session.userId, targetType, targetId };
  const existing = await prisma.favorite.findUnique({ where: { userId_targetType_targetId: key } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ active: false });
  }
  await prisma.favorite.create({ data: key });
  return NextResponse.json({ active: true });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await prisma.favorite.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: rows });
}

export type { TargetType };
