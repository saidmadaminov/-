import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { complaintSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`complaint:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "too many" }, { status: 429 });
  }
  const parsed = complaintSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await prisma.complaint.create({
    data: { userId: session.userId, ...parsed.data },
  });
  return NextResponse.json({ ok: true });
}
