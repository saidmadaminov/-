export default function EmptyState({ text, icon = "🔎" }: { text: string; icon?: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-medium text-ink-500">{text}</p>
    </div>
  );
}
