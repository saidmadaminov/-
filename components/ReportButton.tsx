"use client";

// Пожаловаться (раздел 34 ТЗ).
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { COMPLAINT_REASON_LABELS_RU, COMPLAINT_REASONS, type TargetType } from "@/types";

export default function ReportButton({ targetType, targetId }: { targetType: TargetType; targetId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(COMPLAINT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, description: description || undefined }),
      });
      if (res.ok) setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost text-ink-400">
        ⚑ {t.complaint.report}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="py-6 text-center">
                <p className="text-3xl">✓</p>
                <p className="mt-2 text-sm font-medium text-ink-700">{t.complaint.thanks}</p>
              </div>
            ) : (
              <>
                <h3 className="mb-4 text-base font-bold">{t.complaint.report}</h3>
                <label className="label">{t.complaint.reason}</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="input mb-3">
                  {COMPLAINT_REASONS.map((r) => (
                    <option key={r} value={r}>{COMPLAINT_REASON_LABELS_RU[r]}</option>
                  ))}
                </select>
                <label className="label">{t.complaint.description}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input mb-4 min-h-20"
                  maxLength={2000}
                />
                <div className="flex gap-2">
                  <button onClick={submit} disabled={busy} className="btn-primary flex-1">{t.complaint.submit}</button>
                  <button onClick={() => setOpen(false)} className="btn-secondary">{t.common.cancel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
