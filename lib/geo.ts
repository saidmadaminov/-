// Гео-утилиты: Haversine-расстояние и форматирование.

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function distanceKm(
  from: { lat: number; lng: number } | null | undefined,
  to: { lat?: number | null; lng?: number | null } | null | undefined
): number | null {
  if (!from || to?.lat == null || to?.lng == null) return null;
  return haversineKm(from.lat, from.lng, to.lat, to.lng);
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return "";
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} м`;
  return `${km.toFixed(1).replace(".", ",")} км`;
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "";
  return `${new Intl.NumberFormat("ru-RU").format(price)} сом`;
}

export function formatPriceRange(from?: number | null, to?: number | null): string {
  if (from != null && to != null) return `от ${formatPrice(from)}`;
  if (from != null) return `от ${formatPrice(from)}`;
  if (to != null) return `до ${formatPrice(to)}`;
  return "Цена по запросу";
}

/** Ссылка на построение маршрута (Google Maps directions, работает без ключа). */
export function routeUrl(lat?: number | null, lng?: number | null, address?: string | null): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "Бишкек")}`;
}

// Центр Бишкека — дефолт для MVP (раздел 45 ТЗ: сначала один город).
export const BISHKEK_CENTER = { lat: 42.8746, lng: 74.5698 };
