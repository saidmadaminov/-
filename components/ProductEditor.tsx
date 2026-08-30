"use client";

// Редактирование товара: цена, наличие, количество, описание, фото (+/−).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { formatPrice } from "@/lib/geo";

interface Image { id: string; url: string }
interface P {
  id: string;
  title: string;
  price: number;
  description?: string | null;
  quantity: number;
  status: string;
  condition: string;
  images: Image[];
}

export default function ProductEditor({ product }: { product: P }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(String(product.price));
  const [quantity, setQuantity] = useState(String(product.quantity));
  const [status, setStatus] = useState(product.status);
  const [description, setDescription] = useState(product.description ?? "");
  const [images, setImages] = useState<Image[]>(product.images);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const pick = (files: FileList) => {
    for (const f of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => setNewImages((arr) => [...arr, String(reader.result)].slice(0, 6));
      reader.readAsDataURL(f);
    }
  };

  const save = async () => {
    setBusy(true);
    const res = await fetch(`/api/business/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, price: Number(price), quantity: Number(quantity),
        status, description: description || undefined,
        addImages: newImages.length ? newImages : undefined,
        removeImageIds: images.filter((i) => !product.images.some((pi) => pi.id === i.id)).map((i) => i.id),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setOpen(false);
      setNewImages([]);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-bold hover:text-brand-700">{product.title}</p>
          <p className="text-xs text-ink-400">
            {formatPrice(product.price)} · {product.quantity} шт · {product.images.length} фото · 👁 {product.status === "AVAILABLE" ? t.common.inStock : t.common.outOfStock}
          </p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {saved && <span className="text-xs text-emerald-600">✓</span>}
          <button onClick={() => setOpen((v) => !v)} className="btn-secondary !py-1.5 !px-3 text-xs">
            {open ? t.common.cancel : "✏️"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-ink-100 pt-3 dark:border-ink-600">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Название</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{t.common.price}, сом</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Количество</label>
              <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                <option value="AVAILABLE">{t.common.inStock}</option>
                <option value="OUT_OF_STOCK">{t.common.outOfStock}</option>
                <option value="HIDDEN">Скрыт</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-20" />
          </div>
          <div>
            <label className="label">Фото</label>
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    onClick={() => setImages((arr) => arr.filter((i) => i.id !== img.id))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                  >×</button>
                </div>
              ))}
              {newImages.map((img, i) => (
                <div key={`new-${i}`} className="relative opacity-70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    onClick={() => setNewImages((arr) => arr.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                  >×</button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-300 text-xl text-ink-400 hover:border-brand-400 dark:border-ink-500">
                +
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && pick(e.target.files)} />
              </label>
            </div>
          </div>
          <button onClick={save} disabled={busy || title.length < 3} className="btn-primary">{t.common.save}</button>
        </div>
      )}
    </div>
  );
}
