import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveBase64Image } from "@/lib/storage";

export const runtime = "nodejs";

/** Загрузка изображения (base64 data URL) → путь в /uploads. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { imageBase64 } = await req.json().catch(() => ({}));
  if (typeof imageBase64 !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    const url = await saveBase64Image(imageBase64);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "upload failed" }, { status: 400 });
  }
}
