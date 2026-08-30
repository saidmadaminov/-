"use client";

// «Наблюдатели» — подписка на бизнес/специалиста.
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { pluralRu } from "@/lib/utils";

export default function WatchButton({
  ownerType,
  ownerId,
  initialCount,
  initialWatching,
  isLoggedIn,
}: {
  ownerType: "BUSINESS" | "SPECIALIST";
  ownerId: string;
  initialCount: number;
  initialWatching: boolean;
  isLoggedIn: boolean;
}) {
  const { t } = useI18n();
  const [count, setCount] = useState(initialCount);
  const [watching, setWatching] = useState(initialWatching);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!isLoggedIn) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerType, ownerId }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setWatching(data.watching);
      setCount((c) => c + (data.watching ? 1 : -1));
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={watching ? "btn-secondary !py-1.5 text-xs !border-brand-400 !text-brand-700" : "btn-secondary !py-1.5 text-xs"}
    >
      {watching ? `👁 ${t.common.watching}` : `👁 ${t.common.watch}`}
      <span className="text-ink-400">· {count} {pluralRu(count, t.common.watchers.slice(0, 0) + "наблюдатель", "наблюдателя", t.common.watchers)}</span>
    </button>
  );
}
