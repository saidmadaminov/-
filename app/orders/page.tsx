// Мои заказы / заказы клиентов (раздел 23 ТЗ).
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/geo";
import { formatDateTime } from "@/lib/utils";
import OrderStatusActions from "@/components/OrderStatusActions";
import { ORDER_STATUSES, type OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const isProvider = user.role === "BUSINESS" || user.role === "SPECIALIST";
  const orders = await prisma.order.findMany({
    where: isProvider
      ? { OR: [{ businessId: user.business?.id }, { specialistId: user.specialist?.id }] }
      : { customerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true, phone: true } },
      product: { select: { title: true } },
      service: { select: { title: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-extrabold">
        {isProvider ? "Заказы клиентов" : "Мои заказы"}
      </h1>
      {orders.length === 0 && (
        <p className="card p-8 text-center text-sm text-ink-400">Заказов пока нет</p>
      )}
      <div className="space-y-3">
        {orders.map((o) => {
          const title = o.product?.title ?? o.service?.title ?? "—";
          return (
            <div key={o.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  №{o.code} · <span className="font-medium">{title}</span>
                </p>
                <p className="text-xs text-ink-400">
                  {formatDateTime(o.createdAt)}
                  {isProvider && o.customer ? ` · ${o.customer.name}` : ""}
                  {o.totalAmount ? ` · ${formatPrice(o.totalAmount)}` : ""}
                </p>
                {o.note && <p className="mt-1 text-xs text-ink-500">💬 {o.note}</p>}
              </div>
              <OrderStatusActions
                orderId={o.id}
                status={(ORDER_STATUSES.includes(o.status as OrderStatus) ? o.status : "NEW") as OrderStatus}
                canManage={isProvider}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
