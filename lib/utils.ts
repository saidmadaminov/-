export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `id-${Date.now().toString(36)}`;
}

export function formatDate(d: Date | string | null | undefined, locale = "ru-RU"): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined, locale = "ru-RU"): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Открыт ли бизнес сейчас (по BusinessHours, Asia/Bishkek = UTC+6). */
export function isOpenNow(
  hours: { day: number; open: string; close: string; isClosed: boolean }[]
): boolean {
  if (!hours.length) return false;
  // UTC+6 без DST
  const now = new Date(Date.now() + 6 * 3600 * 1000);
  // getUTCDay: 0=Вс; наши дни: 0=Пн..6=Вс
  const day = (now.getUTCDay() + 6) % 7;
  const h = hours.find((x) => x.day === day);
  if (!h || h.isClosed) return false;
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [oh, om] = h.open.split(":").map(Number);
  const [ch, cm] = h.close.split(":").map(Number);
  return minutes >= oh * 60 + (om || 0) && minutes <= ch * 60 + (cm || 0);
}

export const DAY_NAMES_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
