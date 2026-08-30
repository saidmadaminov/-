import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n/provider";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: {
    default: "Naydi — товары, услуги и специалисты рядом в Бишкеке",
    template: "%s | Naydi",
  },
  description:
    "Naydi — цифровой помощник для решения повседневных задач в Бишкеке: найдите товары, услуги и проверенных специалистов рядом с вами, сравните цены, рейтинги и расстояние.",
  keywords: [
    "Бишкек", "найти сантехника", "электрик Бишкек", "услуги Бишкек",
    "товары Бишкек", "специалисты Бишкек", "карта магазинов Бишкек",
  ],
  openGraph: {
    title: "Naydi — просто скажи, что тебе нужно",
    description: "Товары, услуги и проверенные специалисты рядом с вами в Бишкеке.",
    locale: "ru_KG",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b52f5",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = cookies();
  const locale = jar.get(LOCALE_COOKIE)?.value;
  const theme = jar.get("naydi_theme")?.value;
  const user = await getCurrentUser();

  return (
    <html lang={locale === "en" ? "en" : "ru"} className={theme === "dark" ? "dark" : undefined}>
      <head>
        {/* Без мигания: тема применяется до гидратации */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(document.cookie.indexOf('naydi_theme=dark')>-1)document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <Header user={user ? { name: user.name, role: user.role } : null} />
          <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-3 pb-24 pt-4 sm:px-5 md:pb-10">
            {children}
          </main>
          <footer className="border-t border-ink-100 bg-white py-8 pb-24 text-center text-xs text-ink-400 md:pb-8">
            <p>
              <a href="/rules" className="mx-1 hover:underline">Правила платформы</a>
              · Naydi — MVP платформа для Бишкека. Демо-данные помечены как «Demo data».
            </p>
          </footer>
          <BottomNav role={user?.role ?? null} />
        </I18nProvider>
      </body>
    </html>
  );
}
