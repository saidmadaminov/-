"use client";

// Форма отзыва с критериями (раздел 20 ТЗ).
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { TargetType } from "@/types";

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-ink-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-xl transition ${n <= value ? "text-amber-400" : "text-ink-200 hover:text-amber-200"}`}
            aria-label={`${label}: ${n}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewForm({
  targetType,
  targetId,
  isLoggedIn,
}: {
  targetType: TargetType;
  targetId: string;
  isLoggedIn: boolean;
}) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [quality, setQuality] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  if (!isLoggedIn) {
    return (
      <a href="/login" className="btn-secondary w-full sm:w-auto">
        {t.common.loginRequired}
      </a>
    );
  }

  if (state === "done") {
    return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">✓ {t.review.thanks}</p>;
  }

  const submit = async () => {
    if (rating === 0) return;
    setState("busy");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        rating,
        quality: quality || undefined,
        speed: speed || undefined,
        communication: communication || undefined,
        comment: comment || undefined,
      }),
    });
    if (res.ok) setState("done");
    else if (res.status === 409) setState("error");
    else setState("error");
  };

  return (
    <div className="card space-y-3 p-4">
      <h4 className="text-sm font-bold">{t.review.leave}</h4>
      {state === "error" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{t.review.already}</p>
      )}
      <Stars value={rating} onChange={setRating} label={t.review.yourRating} />
      <Stars value={quality} onChange={setQuality} label={t.review.quality} />
      <Stars value={speed} onChange={setSpeed} label={t.review.speed} />
      <Stars value={communication} onChange={setCommunication} label={t.review.communication} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.review.comment}
        className="input min-h-20"
        maxLength={2000}
      />
      <button onClick={submit} disabled={rating === 0 || state === "busy"} className="btn-primary w-full sm:w-auto">
        {t.review.submit}
      </button>
    </div>
  );
}
