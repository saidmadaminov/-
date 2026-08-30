import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 15, 60_000)) {
    return NextResponse.json({ error: "Слишком много попыток, подождите минуту" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }
  const { login, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: login }, { email: login.toLowerCase() }] },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  if (user.isBlocked) {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role as never, name: user.name });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
