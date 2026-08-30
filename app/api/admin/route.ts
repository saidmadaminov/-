import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/**
 * Админ-действия (раздел 33 ТЗ):
 * verify: approve/reject — верификация;
 * block/unblock — пользователи;
 * review: hide/publish — модерация отзывов;
 * video: approve/reject — модерация видео;
 * complaint: resolve — обработка жалоб.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { action, id, value } = await req.json().catch(() => ({}));
  if (!action || !id) return NextResponse.json({ error: "bad request" }, { status: 400 });

  switch (action) {
    case "verify.approve": {
      const v = await prisma.verification.findUnique({ where: { id } });
      if (!v) return NextResponse.json({ error: "not found" }, { status: 404 });
      await prisma.$transaction([
        prisma.verification.update({
          where: { id },
          data: { status: "VERIFIED", reviewedAt: new Date(), reviewerId: admin.userId },
        }),
        v.businessId
          ? prisma.business.update({ where: { id: v.businessId }, data: { isVerified: true, verificationStatus: "VERIFIED" } })
          : prisma.specialist.update({ where: { id: v.specialistId! }, data: { isVerified: true, verificationStatus: "VERIFIED" } }),
      ]);
      return NextResponse.json({ ok: true });
    }
    case "verify.reject": {
      const v = await prisma.verification.findUnique({ where: { id } });
      if (!v) return NextResponse.json({ error: "not found" }, { status: 404 });
      await prisma.$transaction([
        prisma.verification.update({
          where: { id },
          data: { status: "REJECTED", reviewedAt: new Date(), reviewerId: admin.userId },
        }),
        v.businessId
          ? prisma.business.update({ where: { id: v.businessId }, data: { isVerified: false, verificationStatus: "REJECTED" } })
          : prisma.specialist.update({ where: { id: v.specialistId! }, data: { isVerified: false, verificationStatus: "REJECTED" } }),
      ]);
      return NextResponse.json({ ok: true });
    }
    case "user.block":
      await prisma.user.update({ where: { id }, data: { isBlocked: value !== false } });
      return NextResponse.json({ ok: true });
    case "review.hide":
      await prisma.review.update({ where: { id }, data: { status: value === "publish" ? "PUBLISHED" : "HIDDEN" } });
      return NextResponse.json({ ok: true });
    case "video.moderate":
      await prisma.video.update({ where: { id }, data: { status: value ?? "APPROVED" } });
      return NextResponse.json({ ok: true });
    case "complaint.resolve":
      await prisma.complaint.update({
        where: { id },
        data: { status: "RESOLVED", adminResponse: typeof value === "string" ? value : "Обработано" },
      });
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
