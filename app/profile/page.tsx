// Личный кабинет пользователя (раздел 29 ТЗ).
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [ordersCount, favoritesCount, reviewsCount] = await Promise.all([
    prisma.order.count({ where: { customerId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { authorId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="card flex items-center gap-4 p-5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
            {user.name.slice(0, 1)}
          </span>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-ink-400">
            {user.phone ?? user.email} · {user.role}
          </p>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/orders" className="card p-4 text-center transition hover:shadow-lg">
          <p className="text-2xl font-extrabold text-brand-700">{ordersCount}</p>
          <p className="text-xs text-ink-500">Заказы</p>
        </Link>
        <Link href="/favorites" className="card p-4 text-center transition hover:shadow-lg">
          <p className="text-2xl font-extrabold text-brand-700">{favoritesCount}</p>
          <p className="text-xs text-ink-500">Избранное</p>
        </Link>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-brand-700">{reviewsCount}</p>
          <p className="text-xs text-ink-500">Отзывы</p>
        </div>
      </div>

      {(user.role === "BUSINESS" || user.role === "ADMIN") && (
        <Link href="/business-dashboard" className="card flex items-center justify-between p-4 transition hover:shadow-lg">
          <span className="text-sm font-bold">🏪 Кабинет бизнеса</span>
          <span className="text-xs font-semibold text-brand-600">Открыть →</span>
        </Link>
      )}
      {user.role === "SPECIALIST" && user.specialist && (
        <Link href={`/specialist/${user.specialist.id}`} className="card flex items-center justify-between p-4 transition hover:shadow-lg">
          <span className="text-sm font-bold">👷 Мой публичный профиль</span>
          <span className="text-xs font-semibold text-brand-600">Открыть →</span>
        </Link>
      )}
      {user.role === "CUSTOMER" && (
        <Link href="/register" className="card hidden items-center justify-between p-4">
          <span className="text-sm font-bold">Стать продавцом</span>
        </Link>
      )}
      {user.role === "ADMIN" && (
        <Link href="/admin" className="card flex items-center justify-between p-4 transition hover:shadow-lg">
          <span className="text-sm font-bold">🛡 Админ-панель</span>
          <span className="text-xs font-semibold text-brand-600">Открыть →</span>
        </Link>
      )}

      <ProfileForm
        initial={{
          name: user.name,
          email: user.email ?? "",
          address: user.address ?? "",
          lat: user.lat,
          lng: user.lng,
          bio: user.profile?.bio ?? "",
          profession: user.specialist?.profession ?? "",
          experienceYears: user.specialist?.experienceYears ?? 0,
        }}
        isSpecialist={user.role === "SPECIALIST"}
      />
    </div>
  );
}
