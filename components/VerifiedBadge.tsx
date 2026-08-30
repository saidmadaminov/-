"use client";

// Значок «Проверенный» с юридически корректным пояснением (раздел 18 ТЗ).
import { useI18n } from "@/lib/i18n/provider";

export default function VerifiedBadge({ withText = true }: { withText?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="badge-verified" title={t.common.verifiedHint}>
      ✓ {withText ? t.common.verified : ""}
    </span>
  );
}
