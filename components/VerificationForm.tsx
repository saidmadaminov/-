"use client";

// Верификация (разделы 17–18 ТЗ): подача заявки с документами.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

const STATUS_TEXT: Record<string, { label: string; className: string }> = {
  NONE: { label: "Не подтверждён", className: "bg-ink-100 text-ink-500" },
  PENDING: { label: "На рассмотрении", className: "bg-amber-50 text-amber-700" },
  VERIFIED: { label: "Проверенный ✓", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Отклонён", className: "bg-red-50 text-red-600" },
  SUSPENDED: { label: "Приостановлен", className: "bg-red-50 text-red-600" },
};

const DOC_TYPES = [
  { value: "REGISTRATION", label: "Регистрационные документы" },
  { value: "IDENTITY", label: "Удостоверение личности" },
  { value: "CERTIFICATE", label: "Сертификат / диплом" },
  { value: "ADDRESS", label: "Подтверждение адреса" },
  { value: "OTHER", label: "Другое" },
];

export default function VerificationForm({
  status,
  targetType,
}: {
  status: string;
  targetType: "BUSINESS" | "SPECIALIST";
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [docs, setDocs] = useState([{ docType: "IDENTITY", fileUrl: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const st = STATUS_TEXT[status] ?? STATUS_TEXT.NONE;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        note: note || undefined,
        documents: docs.filter((d) => d.fileUrl.trim()).map((d) => ({ docType: d.docType, fileUrl: d.fileUrl })),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.common.error);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">✓ {t.dashboard.verification}</h2>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}>
            {st.label}
          </span>
          {done && <p className="mt-1 text-xs text-emerald-600">Заявка отправлена</p>}
        </div>
        {status !== "VERIFIED" && status !== "PENDING" && (
          <button onClick={() => setOpen((v) => !v)} className="btn-primary">
            {t.dashboard.submitVerification}
          </button>
        )}
      </div>
      {status === "PENDING" && (
        <p className="mt-2 text-xs text-ink-500">Администратор проверит документы в течение 1–2 дней.</p>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          {docs.map((d, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[200px_1fr]">
              <select
                value={d.docType}
                onChange={(e) => setDocs((arr) => arr.map((x, j) => (j === i ? { ...x, docType: e.target.value } : x)))}
                className="input"
              >
                {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
              </select>
              <input
                value={d.fileUrl}
                onChange={(e) => setDocs((arr) => arr.map((x, j) => (j === i ? { ...x, fileUrl: e.target.value } : x)))}
                className="input"
                placeholder="Ссылка на документ / название файла"
              />
            </div>
          ))}
          <button
            onClick={() => setDocs((arr) => [...arr, { docType: "OTHER", fileUrl: "" }])}
            className="btn-ghost"
          >
            + Документ
          </button>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input min-h-16"
            placeholder="Комментарий к заявке"
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy || !docs.some((d) => d.fileUrl.trim())} className="btn-primary">
            {t.dashboard.submitVerification}
          </button>
        </div>
      )}
    </div>
  );
}
