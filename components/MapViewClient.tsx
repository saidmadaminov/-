"use client";

// Обёртка: react-leaflet не работает при SSR — грузим динамически.
import dynamic from "next/dynamic";
import type { MapPoint } from "@/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-ink-100 text-sm text-ink-400">
      🗺 Загрузка карты…
    </div>
  ),
});

export default function MapViewClient(props: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}) {
  return <MapView {...props} />;
}
