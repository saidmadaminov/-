import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { LOCATION_COOKIE } from "@/lib/location-cookie";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().email().optional(),
  bio: z.string().trim().max(1000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: z.string().trim().max(200).optional(),
  profession: z.string().trim().max(80).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

/** Обновление профиля / местоположения (раздел 6, 29 ТЗ). */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const d = parsed.data;

  if (d.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !d.currentPassword || !(await verifyPassword(d.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Текущий пароль неверен" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: await hashPassword(d.newPassword) },
    });
  }

  const userData: Record<string, unknown> = {};
  if (d.name) userData.name = d.name;
  if (d.email) userData.email = d.email.toLowerCase();
  if (d.lat != null) { userData.lat = d.lat; userData.lng = d.lng; }
  if (d.address != null) userData.address = d.address;
  if (Object.keys(userData).length) {
    await prisma.user.update({ where: { id: session.userId }, data: userData });
  }
  if (d.bio != null) {
    await prisma.profile.upsert({
      where: { userId: session.userId },
      update: { bio: d.bio },
      create: { userId: session.userId, bio: d.bio },
    });
  }
  if (d.profession != null || d.experienceYears != null) {
    const specData: Record<string, unknown> = {};
    if (d.profession) specData.profession = d.profession;
    if (d.experienceYears != null) specData.experienceYears = d.experienceYears;
    await prisma.specialist.updateMany({ where: { userId: session.userId }, data: specData });
  }

  const res = NextResponse.json({ ok: true });
  // Координаты в cookie — чтобы анонимный поиск «рядом» тоже работал
  if (d.lat != null && d.lng != null) {
    res.cookies.set(LOCATION_COOKIE, `${d.lat},${d.lng}`, { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" });
  }
  return res;
}
