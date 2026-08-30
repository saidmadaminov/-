"use client";

// Формы кабинета: создание бизнеса, добавление товара/услуги (разделы 30–32 ТЗ).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

interface CategoryOption { id: number; name: string; slug: string; icon: string }

export default function DashboardCreateForms({
  needBusiness = false,
}: {
  needBusiness?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"none" | "business" | "product" | "service">(needBusiness ? "business" : "none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Бизнес
  const [bName, setBName] = useState("");
  const [bDesc, setBDesc] = useState("");
  const [bAddr, setBAddr] = useState("");
  const [bPhone, setBPhone] = useState("");

  // Товар
  const [pTitle, setPTitle] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");

  // Услуга
  const [sTitle, setSTitle] = useState("");
  const [sFrom, setSFrom] = useState("");
  const [sTo, setSTo] = useState("");
  const [sDesc, setSDesc] = useState("");

  const post = async (url: string, body: Record<string, unknown>, done: () => void) => {
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      done();
      setOk("✓ " + t.common.saved);
      router.refresh();
      setTimeout(() => setOk(null), 2500);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.common.error);
    }
  };

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-extrabold">Добавить</h2>
        {!needBusiness && (
          <>
            <button onClick={() => setTab(tab === "product" ? "none" : "product")} className={`chip !py-1 text-xs ${tab === "product" ? "chip-active" : ""}`}>
              {t.dashboard.addProduct}
            </button>
            <button onClick={() => setTab(tab === "service" ? "none" : "service")} className={`chip !py-1 text-xs ${tab === "service" ? "chip-active" : ""}`}>
              {t.dashboard.addService}
            </button>
          </>
        )}
      </div>

      {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{ok}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {tab === "business" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">{t.dashboard.businessName}</label>
            <input value={bName} onChange={(e) => setBName(e.target.value)} className="input" placeholder="ТехноМаркет" /></div>
          <div><label className="label">{t.dashboard.phone}</label>
            <input value={bPhone} onChange={(e) => setBPhone(e.target.value)} className="input" placeholder="+996…" /></div>
          <div className="sm:col-span-2"><label className="label">{t.dashboard.address}</label>
            <input value={bAddr} onChange={(e) => setBAddr(e.target.value)} className="input" placeholder="ул. …" /></div>
          <div className="sm:col-span-2"><label className="label">{t.dashboard.description}</label>
            <textarea value={bDesc} onChange={(e) => setBDesc(e.target.value)} className="input min-h-20" /></div>
          <button
            disabled={busy || bName.length < 2}
            onClick={() => post("/api/business", { name: bName, description: bDesc, address: bAddr, phone: bPhone }, () => { setBName(""); setBDesc(""); setBAddr(""); setBPhone(""); })}
            className="btn-primary sm:col-span-2"
          >
            {t.dashboard.createBusiness}
          </button>
        </div>
      )}

      {tab === "product" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Название</label>
            <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} className="input" placeholder="iPhone 13 128GB" /></div>
          <div><label className="label">{t.common.price}, сом</label>
            <input type="number" min={0} value={pPrice} onChange={(e) => setPPrice(e.target.value)} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">{t.dashboard.description}</label>
            <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} className="input min-h-20" /></div>
          <button
            disabled={busy || pTitle.length < 3 || !pPrice}
            onClick={() => post("/api/business/products", { title: pTitle, price: Number(pPrice), description: pDesc }, () => { setPTitle(""); setPPrice(""); setPDesc(""); })}
            className="btn-primary sm:col-span-2"
          >
            {t.dashboard.addProduct}
          </button>
        </div>
      )}

      {tab === "service" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Название услуги</label>
            <input value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="input" placeholder="Замена смесителя" /></div>
          <div><label className="label">Цена от, сом</label>
            <input type="number" min={0} value={sFrom} onChange={(e) => setSFrom(e.target.value)} className="input" /></div>
          <div><label className="label">Цена до, сом</label>
            <input type="number" min={0} value={sTo} onChange={(e) => setSTo(e.target.value)} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">{t.dashboard.description}</label>
            <textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} className="input min-h-20" /></div>
          <button
            disabled={busy || sTitle.length < 3}
            onClick={() => post("/api/business/services", {
              title: sTitle, description: sDesc,
              priceFrom: sFrom ? Number(sFrom) : undefined,
              priceTo: sTo ? Number(sTo) : undefined,
            }, () => { setSTitle(""); setSFrom(""); setSTo(""); setSDesc(""); })}
            className="btn-primary sm:col-span-2"
          >
            {t.dashboard.addService}
          </button>
        </div>
      )}
    </section>
  );
}
