export default function StarRating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
}) {
  const full = Math.round(value);
  const sizes = { sm: "text-xs", md: "text-sm", lg: "text-lg" } as const;
  return (
    <span className={`inline-flex items-center gap-1 ${sizes[size]}`}>
      <span className="text-amber-400" aria-hidden>
        {"★".repeat(Math.max(0, full))}
        <span className="text-ink-200">{"★".repeat(Math.max(0, 5 - full))}</span>
      </span>
      <span className="font-semibold text-ink-800">{value > 0 ? value.toFixed(1) : "—"}</span>
      {count != null && <span className="text-ink-400">({count})</span>}
    </span>
  );
}
