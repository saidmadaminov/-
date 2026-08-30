"use client";

// Интерфейс AI-ассистента (разделы 25–26 ТЗ).
// AI вызывает внутренний поиск и возвращает только реальные предложения.
import { useRef } from "react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import OfferCard from "./OfferCard";
import type { UnifiedOffer } from "@/types";

interface AiResponse {
  explanation: string;
  offers: UnifiedOffer[];
  best?: UnifiedOffer | null;
  usedLlm: boolean;
}

export default function AiAssistant() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; data?: AiResponse }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data: AiResponse = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.explanation, data }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: t.common.error }]);
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-extrabold">🤖 {t.assistant.title}</h1>
        <p className="mt-1 text-sm text-ink-500">{t.assistant.subtitle}</p>
      </div>

      <div className="card space-y-4 p-4">
        {messages.length === 0 && (
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
            <p className="font-semibold">{t.home.heroTitle}</p>
            <p className="mt-1 text-xs opacity-75">{t.assistant.disclaimer}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white" : "w-full max-w-[95%] space-y-3"}>
              {m.role === "user" ? (
                m.text
              ) : (
                <>
                  <div className="rounded-2xl rounded-bl-sm bg-ink-100 px-4 py-2.5 text-sm text-ink-800">
                    🤖 {m.text}
                  </div>
                  {m.data && m.data.offers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-ink-500">
                        {t.assistant.found}: {m.data.offers.length}
                      </p>
                      {m.data.best && (
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-2">
                          <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                            ⭐ {t.assistant.bestPick}
                          </p>
                          <OfferCard offer={m.data.best} />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {m.data.offers.filter((o) => o.id !== m.data?.best?.id).slice(0, 6).map((o) => (
                          <OfferCard key={`${o.type}-${o.id}`} offer={o} compact />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-ink-100 px-4 py-2.5 text-sm text-ink-500">
              🤖 {t.assistant.thinking}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-16 mt-3 flex gap-2 md:bottom-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder={t.assistant.placeholder}
          className="input !py-3"
        />
        <button onClick={ask} disabled={busy} className="btn-primary !py-3">
          {t.assistant.ask}
        </button>
      </div>
    </div>
  );
}
