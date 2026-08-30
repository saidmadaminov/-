"use client";

// Кнопки смены статуса заказа (раздел 23 ТЗ).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { ORDER_TRANSITIONS, ORDER_STATUS_LABELS_RU, type OrderStatus } from "@/types";

const L = ORDER_STATUS_LABELS_RU;

const ACTION_FOR: Partial<Record<OrderStatus, { label: string; className: string }>> = {
  ACCEPTED: { label: "Принять", className: "btn-primary !py-1.5 !px-3 text-xs" },
  IN_PROGRESS: { label: "В работу", className: "btn-primary !py-1.5 !px-3 text-xs" },
  COMPLETED: { label: "Завершить", className: "btn-primary !py-1.5 !px-3 text-xs bg-emerald-600 hover:bg-emerald-700" },
  CANCELLED: { label: "Отменить", className: "btn-secondary !py-1.5 !px-3 text-xs !text-red-600" },
};

export default function OrderStatusActions({
  orderId,
  status,
  canManage,
}: {
  orderId: string;
  status: OrderStatus;
  canManage: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const next = ORDER_TRANSITIONS[status].filter((s) =>
    canManage ? true : s === "CANCELLED"
  );

  const set = async (nextStatus: OrderStatus) => {
    setBusy(true);
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
        status === "CANCELLED" ? "bg-red-50 text-red-600" :
        status === "NEW" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
      }`}>
        {L[status]}
      </span>
      {next.map((s) => {
        const a = ACTION_FOR[s];
        if (!a) return null;
        const label = s === "CANCELLED" ? t.order.cancelOrder :
          s === "ACCEPTED" ? t.order.accept :
          s === "IN_PROGRESS" ? t.order.inProgress : t.order.complete;
        return (
          <button key={s} onClick={() => set(s)} disabled={busy} className={a.className}>
            {label}
          </button>
        );
      })}
      <span className="sr-only">{ORDER_STATUS_LABELS_RU[status]}</span>
    </div>
  );
}
