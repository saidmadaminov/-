"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(sp.get("next") || "/home");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t.auth.invalidCredentials);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-6">
        <h1 className="mb-6 text-center text-2xl font-extrabold">{t.auth.loginTitle}</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t.auth.phoneOrEmail}</label>
            <input value={login} onChange={(e) => setLogin(e.target.value)} className="input" placeholder="+996… или email" required />
          </div>
          <div>
            <label className="label">{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
            {t.auth.loginSubmit}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            {t.nav.register}
          </Link>
        </p>
      </div>
      <div className="card mt-4 p-4 text-xs leading-relaxed text-ink-500">
        <p className="mb-1 font-bold text-ink-700">Demo-аккаунты:</p>
        <p>Клиент: <code>+996700111111</code> / <code>Demo1234</code></p>
        <p>Бизнес: <code>tech@naydi.kg</code> / <code>Demo1234</code></p>
        <p>Админ: <code>admin@naydi.kg</code> / <code>Admin123!</code></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
