"use client";

// Карта на Leaflet + OpenStreetMap (без API-ключа, раздел 11 ТЗ).
// Динамическая подгрузка с ssr:false — обёртка ниже.
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { formatPrice, formatPriceRange } from "@/lib/geo";
import type { MapPoint } from "@/types";

function pinIcon(point: MapPoint) {
  return L.divIcon({
    className: "",
    html: `<div class="naydi-pin ${point.verified ? "verified" : ""}"><span>${point.icon ?? "📍"}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

export default function MapView({
  points,
  center = [42.8746, 74.5698],
  zoom = 12,
  height = "420px",
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  const { t } = useI18n();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker key={`${p.type}-${p.id}`} position={[p.lat, p.lng]} icon={pinIcon(p)}>
          <Popup>
            <div className="min-w-44 space-y-1">
              <p className="text-sm font-bold leading-snug">{p.title}</p>
              {p.categoryName && <p className="text-xs text-gray-500">{p.categoryName}</p>}
              <p className="text-sm font-semibold text-blue-700">
                {p.price != null
                  ? formatPrice(p.price)
                  : p.priceFrom != null
                    ? formatPriceRange(p.priceFrom)
                    : ""}
              </p>
              <p className="text-xs">
                ★ {p.rating > 0 ? p.rating.toFixed(1) : "—"} {p.verified ? "· ✓" : ""}
              </p>
              <Link
                href={
                  p.type === "PRODUCT" ? `/product/${p.id}` :
                  p.type === "SERVICE" ? `/service/${p.id}` :
                  p.type === "BUSINESS" ? `/business/${p.id}` :
                  `/specialist/${p.id}`
                }
                className="mt-1 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-center text-xs font-semibold text-white"
              >
                {t.common.details}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
