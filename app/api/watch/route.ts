import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/** «Наблюдать» — подписка на бизнес/специалиста (toggle). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { ownerType, ownerId } = await req.json().catch(() => ({}));
  if (!ownerType || !ownerId || !["BUSINESS", "SPECIALIST"].includes(ownerType)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const key = { userId: session.userId, ownerType, ownerId };
  const existing = await prisma.watch.findUnique({ where: { userId_ownerType_ownerId: key } });
  if (existing) {
    await prisma.watch.delete({ where: { id: existing.id } });
    return NextResponse.json({ watching: false });
  }
  await prisma.watch.create({ data: key });
  return NextResponse.json({ watching: true });
}

export async function GET(req: NextRequest) {
  const ownerType = req.nextUrl.searchParams.get("ownerType");
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerType || !ownerId) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const count = await prisma.watch.count({ where: { ownerType, ownerId } });
  const session = await getSession();
  const watching = session
    ? !!(await prisma.watch.findUnique({ where: { userId_ownerType_ownerId: { userId: session.userId, ownerType, ownerId } } }))
    : false;
  return NextResponse.json({ count, watching });
}
