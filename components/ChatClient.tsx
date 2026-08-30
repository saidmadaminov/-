"use client";

// Чат (раздел 22 ТЗ): список диалогов + переписка, текст и фото.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatDateTime } from "@/lib/utils";

interface ConvItem {
  id: string;
  counterpartName: string;
  businessName?: string | null;
  lastMessage: string;
  lastAt: string;
}
interface MsgItem {
  id: string;
  mine: boolean;
  text: string;
  imageUrl?: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function ChatClient() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const [convs, setConvs] = useState<ConvItem[]>([]);
  const [active, setActive] = useState<string | null>(sp.get("c"));
  const [messages, setMessages] = useState<MsgItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const loadConvs = useCallback(async () => {
    const res = await fetch("/api/chat/conversations");
    if (res.ok) {
      const data = await res.json();
      setConvs(data.items);
      if (!active && data.items.length) setActive(data.items[0].id);
    }
  }, [active]);

  const loadMessages = useCallback(async (convId: string) => {
    const res = await fetch(`/api/chat/messages?c=${convId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.items);
    }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => {
    if (!active) return;
    loadMessages(active);
    const timer = setInterval(() => loadMessages(active), 5000);
    return () => clearInterval(timer);
  }, [active, loadMessages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !active) return;
    setSending(true);
    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: active, text }),
    });
    setInput("");
    setSending(false);
    loadMessages(active);
    loadConvs();
  };

  const sendPhoto = async (file: File) => {
    if (!active) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active, imageBase64: reader.result }),
      });
      loadMessages(active);
      loadConvs();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[280px_1fr]">
      <aside className={cn("card overflow-hidden", active && "hidden lg:block")}>
        <h1 className="border-b border-ink-100 px-4 py-3 text-sm font-bold">{t.chat.title}</h1>
        {convs.length === 0 && <p className="p-4 text-sm text-ink-400">{t.chat.empty}</p>}
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={cn(
              "block w-full border-b border-ink-50 px-4 py-3 text-left transition hover:bg-ink-50",
              active === c.id && "bg-brand-50"
            )}
          >
            <p className="truncate text-sm font-semibold">
              {c.counterpartName}{c.businessName ? ` · ${c.businessName}` : ""}
            </p>
            <p className="truncate text-xs text-ink-400">{c.lastMessage}</p>
          </button>
        ))}
      </aside>

      <section className={cn("card flex flex-col overflow-hidden", !active && "hidden lg:flex")}>
        {!active ? (
          <p className="m-auto text-sm text-ink-400">Выберите диалог</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ minHeight: "50vh", maxHeight: "60vh" }}>
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.mine && "justify-end")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    m.mine ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-ink-100 text-ink-900"
                  )}>
                    {m.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="mb-1 max-h-48 rounded-lg object-cover" />
                    )}
                    {m.text && <p className="whitespace-pre-line">{m.text}</p>}
                    <p className={cn("mt-0.5 text-[10px]", m.mine ? "text-brand-200" : "text-ink-400")}>
                      {formatDateTime(m.createdAt)}{m.mine && m.readAt ? ` · ${t.chat.read}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="m-auto text-sm text-ink-300">Напишите первое сообщение</p>}
            </div>
            <div className="flex items-center gap-2 border-t border-ink-100 p-3">
              <label className="btn-ghost cursor-pointer text-lg" title="Фото">
                📎
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && sendPhoto(e.target.files[0])} />
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t.chat.inputPlaceholder}
                className="input"
              />
              <button onClick={send} disabled={sending || !input.trim()} className="btn-primary">
                {t.common.send}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
