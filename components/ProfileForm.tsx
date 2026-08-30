"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

interface Initial {
  name: string;
  email: string;
  address: string;
  lat: number | null;
  lng: number | null;
  bio: string;
  profession: string;
  experienceYears: number;
}

export default function ProfileForm({ initial, isSpecialist }: { initial: Initial; isSpecialist: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Initial, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        bio: form.bio || undefined,
        lat: form.lat,
        lng: form.lng,
        profession: isSpecialist && form.profession ? form.profession : undefined,
        experienceYears: isSpecialist ? Number(form.experienceYears) || 0 : undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.common.error);
    }
  };

  const detectGeo = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      set("lat", pos.coords.latitude);
      set("lng", pos.coords.longitude);
    });
  };

  return (
    <div className="card space-y-4 p-5">
      <h2 className="text-base font-bold">Данные профиля</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.auth.name}</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{t.auth.email}</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" />
        </div>
        {isSpecialist && (
          <>
            <div>
              <label className="label">Профессия</label>
              <input value={form.profession} onChange={(e) => set("profession", e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Опыт, лет</label>
              <input type="number" min={0} max={60} value={form.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} className="input" />
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="label">{t.common.location}</label>
          <div className="flex gap-2">
            <input
              value={form.lat != null && form.lng != null ? `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}` : ""}
              placeholder="Координаты не заданы"
              readOnly
              className="input flex-1 bg-ink-50"
            />
            <button onClick={detectGeo} className="btn-secondary shrink-0">📍 {t.common.nearMe}</button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">О себе</label>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} className="input min-h-20" maxLength={1000} />
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary">{t.common.save}</button>
        {saved && <span className="text-sm font-medium text-emerald-600">✓ {t.common.saved}</span>}
      </div>
    </div>
  );
}
