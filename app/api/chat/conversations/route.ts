import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/** Получить или создать диалог с провайдером (раздел 22 ТЗ). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { providerUserId } = await req.json().catch(() => ({}));
  if (!providerUserId || providerUserId === session.userId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const provider = await prisma.user.findUnique({ where: { id: providerUserId } });
  if (!provider) return NextResponse.json({ error: "not found" }, { status: 404 });

  const conv = await prisma.conversation.upsert({
    where: { customerId_providerUserId: { customerId: session.userId, providerUserId } },
    update: {},
    create: { customerId: session.userId, providerUserId },
    include: {
      customer: { select: { name: true } },
      provider: { select: { name: true } },
    },
  });
  return NextResponse.json({ id: conv.id, providerName: conv.provider.name, customerName: conv.customer.name });
}

/** Список моих диалогов. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const convs = await prisma.conversation.findMany({
    where: { OR: [{ customerId: session.userId }, { providerUserId: session.userId }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      customer: { select: { id: true, name: true } },
      provider: { select: { id: true, name: true } },
      business: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const items = convs.map((c) => ({
    id: c.id,
    counterpartName: c.customerId === session.userId ? c.provider.name : c.customer.name,
    isMineProvider: c.providerUserId === session.userId,
    businessName: c.business?.name,
    lastMessage: c.messages[0]?.text ?? "",
    lastAt: c.lastMessageAt,
  }));
  return NextResponse.json({ items });
}
