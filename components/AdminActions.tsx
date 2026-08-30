"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminActions({
  action,
  id,
  label,
  kind = "secondary",
  value,
}: {
  action: string;
  id: string;
  label: string;
  kind?: "primary" | "danger" | "secondary";
  value?: unknown;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const cls =
    kind === "primary" ? "btn-primary !py-1.5 !px-3 text-xs" :
    kind === "danger" ? "btn-secondary !py-1.5 !px-3 text-xs !text-red-600" :
    "btn-secondary !py-1.5 !px-3 text-xs";

  const run = async () => {
    setBusy(true);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, value }),
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <button onClick={run} disabled={busy} className={cls}>
      {label}
    </button>
  );
}
