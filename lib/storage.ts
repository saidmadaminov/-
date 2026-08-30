// Хранилище файлов: локальная папка public/uploads (S3-совместимое
// хранилище подключается в production через тот же интерфейс).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function saveBase64Image(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!match) throw new Error("unsupported image");
  const [, mime, base64] = match;
  if (base64.length > 6_000_000) throw new Error("too large");
  const buf = Buffer.from(base64, "base64");
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ALLOWED[mime]}`;
  writeFileSync(join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

/** Заглушка: URL документа верификации (в MVP — текстовая ссылка/описание). */
export function normalizeDocUrl(url: string): string {
  return url.trim().slice(0, 500);
}
