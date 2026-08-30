import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

async function assertMember(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.customerId !== userId && conv.providerUserId !== userId)) return null;
  return conv;
}

/** Отправка сообщения: текст + опционально картинка (base64 → /uploads). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { conversationId, text, imageBase64 } = await req.json().catch(() => ({}));
  if (!conversationId || (!text && !imageBase64)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const conv = await assertMember(conversationId, session.userId);
  if (!conv) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let imageUrl: string | undefined;
  if (typeof imageBase64 === "string" && imageBase64.startsWith("data:image/")) {
    const { saveBase64Image } = await import("@/lib/storage");
    imageUrl = await saveBase64Image(imageBase64).catch(() => undefined);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.userId,
      text: String(text ?? "").slice(0, 4000),
      imageUrl,
    },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });
  return NextResponse.json({ ok: true, id: message.id, createdAt: message.createdAt });
}

/** Сообщения диалога; попутно помечаем чужие сообщения прочитанными. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const conversationId = req.nextUrl.searchParams.get("c");
  if (!conversationId) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const conv = await assertMember(conversationId, session.userId);
  if (!conv) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: session.userId }, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { name: true } } },
  });
  return NextResponse.json({
    items: messages.map((m) => ({
      id: m.id,
      mine: m.senderId === session.userId,
      text: m.text,
      imageUrl: m.imageUrl,
      readAt: m.readAt,
      createdAt: m.createdAt,
    })),
  });
}
