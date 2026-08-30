import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verificationSchema } from "@/lib/validation";
import { normalizeDocUrl } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Подача заявки на верификацию (раздел 17 ТЗ).
 * В MVP документы указываются ссылками/описанием; в production — загрузка в S3.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = verificationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "bad request" }, { status: 400 });
  }
  const { targetType, note, documents } = parsed.data;

  const business =
    targetType === "BUSINESS"
      ? await prisma.business.findUnique({ where: { ownerId: user.id } })
      : null;
  const specialist =
    targetType === "SPECIALIST"
      ? await prisma.specialist.findUnique({ where: { userId: user.id } })
      : null;

  if (targetType === "BUSINESS" && !business) {
    return NextResponse.json({ error: "Сначала создайте бизнес-профиль" }, { status: 400 });
  }
  if (targetType === "SPECIALIST" && !specialist) {
    return NextResponse.json({ error: "Профиль специалиста не найден" }, { status: 400 });
  }

  const target = business ?? specialist;
  if (target && target.verificationStatus === "PENDING") {
    return NextResponse.json({ error: "Заявка уже на рассмотрении" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.verification.create({
      data: {
        targetType,
        businessId: business?.id ?? null,
        specialistId: specialist?.id ?? null,
        note: note ?? null,
        documents: {
          create: documents.map((d) => ({ docType: d.docType, fileUrl: normalizeDocUrl(d.fileUrl) })),
        },
      },
    }),
    business
      ? prisma.business.update({ where: { id: business.id }, data: { verificationStatus: "PENDING" } })
      : prisma.specialist.update({ where: { id: specialist!.id }, data: { verificationStatus: "PENDING" } }),
  ]);

  return NextResponse.json({ ok: true });
}
