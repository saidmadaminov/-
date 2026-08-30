"use client";

// Блог работ + форма добавления (для владельца).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDateTime } from "@/lib/utils";

interface Post {
  id: string;
  title?: string | null;
  text: string;
  images: { id: string; url: string }[];
  createdAt: string;
  isDemo?: boolean;
}

export default function OwnerContent({
  posts,
  canAdd,
}: {
  posts: Post[];
  canAdd: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || undefined, text, images }),
    });
    setBusy(false);
    setTitle(""); setText(""); setImages([]);
    setOpen(false);
    router.refresh();
  };

  const pickImages = (files: FileList) => {
    for (const f of Array.from(files).slice(0, 6)) {
      const reader = new FileReader();
      reader.onload = () => setImages((arr) => [...arr, String(reader.result)].slice(0, 6));
      reader.readAsDataURL(f);
    }
  };

  return (
    <section className="space-y-3" id="blog">
      <div className="flex items-center justify-between">
        <h2 className="section-title">📷 {t.common.blog}</h2>
        {canAdd && (
          <button onClick={() => setOpen((v) => !v)} className="btn-primary !py-1.5 text-xs">
            {open ? t.common.cancel : `+ ${t.common.addPost}`}
          </button>
        )}
      </div>

      {open && canAdd && (
        <div className="card space-y-3 p-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Заголовок работы" maxLength={120} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-24" placeholder="Расскажите о работе: что сделали, сколько стоило, сколько заняло…" maxLength={5000} />
          <label className="btn-secondary cursor-pointer !py-1.5 text-xs">
            📷 Фото ({images.length}/6)
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && pickImages(e.target.files)} />
          </label>
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={submit} disabled={busy || !text.trim()} className="btn-primary">{t.common.publish}</button>
        </div>
      )}

      {posts.length === 0 && <p className="card p-4 text-sm text-ink-400">Постов пока нет</p>}
      <div className="space-y-3">
        {posts.map((p) => (
          <article key={p.id} className="card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold">{p.title || t.common.addPost}</p>
              <span className="text-[11px] text-ink-400">{formatDateTime(p.createdAt)}</span>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700 dark:text-ink-200">{p.text}</p>
            {p.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {p.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
