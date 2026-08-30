"use client";

// Переключатель светлой/тёмной темы (cookie naydi_theme + class на html).
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `naydi_theme=${next ? "dark" : "light"}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  return (
    <button
      onClick={toggle}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-base transition hover:border-brand-300 dark:border-ink-600 dark:bg-ink-800"
      aria-label="Переключить тему"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
