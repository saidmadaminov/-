"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

export default function SubscribeButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = async () => {
    setBusy(true);
    const res = await fetch("/api/subscription", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  };

  if (done) {
    return <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">✓ Премиум активен</p>;
  }
  return (
    <button onClick={subscribe} disabled={busy} className="btn-primary !px-8 !py-3">
      Оформить подписку
    </button>
  );
}
