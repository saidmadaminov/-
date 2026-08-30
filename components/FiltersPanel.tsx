"use client";

// Панель фильтров (раздел 9 ТЗ): состав зависит от типа предложения.
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { CONDITIONS } from "@/types";

interface CategoryOption {
  slug: string;
  name: string;
  icon: string;
  isParent: boolean;
}

export default function FiltersPanel({ categories }: { categories: CategoryOption[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const type = sp.get("type") || "";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
    router.push(`/search?${next.toString()}`);
  };

  const num = (key: string) => sp.get(key) || "";
  const checked = (key: string) => sp.get(key) === "1";

  const parents = categories.filter((c) => c.isParent);

  return (
    <div className="card space-y-4 p-4">
      <h3 className="text-sm font-bold">{t.common.filters}</h3>

      <div>
        <label className="label">{t.common.category}</label>
        <select value={sp.get("cat") || ""} onChange={(e) => setParam("cat", e.target.value)} className="input">
          <option value="">{t.common.allCategories}</option>
          {parents.map((c) => (
            <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{t.common.price}, сом</label>
        <div className="flex gap-2">
          <input
            type="number" min={0} placeholder="от" defaultValue={num("min")}
            onBlur={(e) => setParam("min", e.target.value)} className="input"
          />
          <input
            type="number" min={0} placeholder="до" defaultValue={num("max")}
            onBlur={(e) => setParam("max", e.target.value)} className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">{t.common.distance}, км</label>
        <select value={sp.get("radius") || ""} onChange={(e) => setParam("radius", e.target.value)} className="input">
          <option value="">{t.common.all}</option>
          <option value="1">до 1 км</option>
          <option value="3">до 3 км</option>
          <option value="5">до 5 км</option>
          <option value="10">до 10 км</option>
          <option value="25">до 25 км</option>
        </select>
      </div>

      <div>
        <label className="label">{t.common.rating}</label>
        <select value={sp.get("rating") || ""} onChange={(e) => setParam("rating", e.target.value)} className="input">
          <option value="">{t.common.all}</option>
          <option value="3">★ 3+</option>
          <option value="4">★ 4+</option>
          <option value="4.5">★ 4.5+</option>
        </select>
      </div>

      {(type === "PRODUCT" || !type) && (
        <>
          <div>
            <label className="label">Состояние</label>
            <select value={sp.get("cond") || ""} onChange={(e) => setParam("cond", e.target.value)} className="input">
              <option value="">{t.common.all}</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c === "NEW" ? t.common.new : t.common.used}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={checked("stock")} onChange={(e) => setParam("stock", e.target.checked ? "1" : null)} />
            {t.common.inStock}
          </label>
        </>
      )}

      {(type === "SERVICE" || type === "SPECIALIST" || !type) && (
        <>
          <div>
            <label className="label">Опыт, лет от</label>
            <select value={sp.get("exp") || ""} onChange={(e) => setParam("exp", e.target.value)} className="input">
              <option value="">{t.common.all}</option>
              <option value="2">2+</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={checked("onsite")} onChange={(e) => setParam("onsite", e.target.checked ? "1" : null)} />
            {t.common.onSite}
          </label>
        </>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={checked("verified")} onChange={(e) => setParam("verified", e.target.checked ? "1" : null)} />
        ✓ {t.common.verified}
      </label>

      <button onClick={() => router.push(`/search${sp.get("q") ? `?q=${encodeURIComponent(sp.get("q")!)}` : ""}`)} className="btn-secondary w-full">
        {t.common.reset}
      </button>
    </div>
  );
}
