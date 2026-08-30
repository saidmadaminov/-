"use client";

// Истории (24 ч): кольцо с превью + просмотрщик + добавление для владельца.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";

interface Story { id: string; imageUrl: string; caption?: string | null }

export default function Stories({
  ownerType,
  ownerId,
  canAdd,
  initial,
}: {
  ownerType: "BUSINESS" | "SPECIALIST";
  ownerId: string;
  canAdd: boolean;
  initial: Story[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>(initial);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const addFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: reader.result }),
      });
      const res = await fetch(`/api/stories?ownerType=${ownerType}&ownerId=${ownerId}`);
      if (res.ok) setStories((await res.json()).items);
      setAdding(false);
      router.refresh();
    };
    reader.readAsDataURL(file);
  };

  if (!canAdd && stories.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {canAdd && (
          <label className="flex cursor-pointer flex-col items-center gap-1">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-ink-300 text-2xl text-ink-400 transition hover:border-brand-400 dark:border-ink-500">
              {adding ? "…" : "+"}
            </span>
            <span className="max-w-16 truncate text-[10px] text-ink-500">{t.common.addStory}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} />
          </label>
        )}
        {stories.map((s, i) => (
          <button key={s.id} onClick={() => setViewIdx(i)} className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-brand-600 p-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.imageUrl} alt="" className="h-16 w-16 rounded-full border-2 border-white object-cover dark:border-ink-900" />
            </span>
            <span className="max-w-16 truncate text-[10px] text-ink-500">{s.caption || t.common.stories}</span>
          </button>
        ))}
      </div>

      {viewIdx != null && stories[viewIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setViewIdx(null)}>
          <div className="relative max-h-[90vh] max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stories[viewIdx].imageUrl} alt="" className="max-h-[85vh] rounded-2xl object-contain" />
            {stories[viewIdx].caption && (
              <p className="mt-2 rounded-xl bg-white/10 px-4 py-2 text-center text-sm text-white">{stories[viewIdx].caption}</p>
            )}
            <div className="absolute inset-x-0 top-0 flex gap-1 p-3">
              {stories.map((s, i) => (
                <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= viewIdx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <button
              onClick={() => setViewIdx(viewIdx + 1 < stories.length ? viewIdx + 1 : null)}
              className="absolute inset-y-0 right-0 w-1/3 cursor-pointer"
              aria-label="next"
            />
          </div>
        </div>
      )}
    </div>
  );
}
