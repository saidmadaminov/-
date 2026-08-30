"use client";

// Многошаговая регистрация (раздел 5 ТЗ):
// 1) телефон/email+пароль → 2) имя → 3) тип аккаунта → 4) геолокация → профиль.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { Role } from "@/types";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [profession, setProfession] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const step1Valid = (phone.trim().length >= 9 || /.+@.+\..+/.test(email)) && password.length >= 6;
  const steps = [1, 2, 3, 4];

  const askGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null),
        { timeout: 8000 }
      );
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        password,
        name,
        role,
        lat: coords?.lat,
        lng: coords?.lng,
        profession: role === "SPECIALIST" ? profession || undefined : undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/home");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t.common.error);
      setStep(1);
    }
  };

  const roleCards: { value: Role; icon: string; label: string }[] = [
    { value: "CUSTOMER", icon: "🛒", label: t.auth.customer },
    { value: "BUSINESS", icon: "🏪", label: t.auth.business },
    { value: "SPECIALIST", icon: "👷", label: t.auth.specialist },
  ];

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-6">
        <h1 className="mb-2 text-center text-2xl font-extrabold">{t.auth.registerTitle}</h1>

        <div className="mb-6 flex items-center justify-center gap-1.5">
          {steps.map((s) => (
            <span
              key={s}
              className={`h-1.5 w-10 rounded-full transition ${s <= step ? "bg-brand-600" : "bg-ink-200"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">{t.auth.phone}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+996 700 123 456" />
            </div>
            <div className="text-center text-xs text-ink-400">или</div>
            <div>
              <label className="label">{t.auth.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">{t.auth.password}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" minLength={6} />
            </div>
            <button disabled={!step1Valid} onClick={() => setStep(2)} className="btn-primary w-full !py-3">
              {t.auth.submit}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">{t.auth.name}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Как вас зовут?" />
            </div>
            {role === "SPECIALIST" && (
              <div>
                <label className="label">Профессия</label>
                <input value={profession} onChange={(e) => setProfession(e.target.value)} className="input" placeholder="Например: электрик" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">{t.common.back}</button>
              <button disabled={name.trim().length < 2} onClick={() => setStep(3)} className="btn-primary flex-1">
                {t.auth.submit}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-center text-sm font-semibold text-ink-600">{t.auth.accountType}</p>
            <div className="grid grid-cols-3 gap-2">
              {roleCards.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
                    role === r.value ? "border-brand-600 bg-brand-50" : "border-ink-200 hover:border-brand-300"
                  }`}
                >
                  <span className="text-3xl">{r.icon}</span>
                  <span className="text-xs font-semibold">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">{t.common.back}</button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">{t.auth.submit}</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold text-ink-600">{t.auth.geoAsk}</p>
            <div className="flex justify-center gap-3 py-2">
              <span className="text-5xl">📍</span>
            </div>
            <p className="text-xs text-ink-400">
              {coords ? `✓ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : t.common.bishkek + " (по умолчанию)"}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">{t.common.back}</button>
              <button onClick={askGeo} className="btn-secondary flex-1">{t.auth.geoYes}</button>
              <button disabled={busy} onClick={submit} className="btn-primary flex-1">
                {busy ? t.common.loading : t.auth.geoSkip}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>

      <p className="mt-4 text-center text-sm text-ink-500">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          {t.nav.login}
        </Link>
      </p>
    </div>
  );
}
