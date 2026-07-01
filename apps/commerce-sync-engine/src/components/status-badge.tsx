import { Badge } from "@/components/ui/badge";
import { formatRunStatus } from "@/lib/sync-utils";

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "applied" || value === "completed"
      ? "green"
      : value === "failed" ||
          value === "partially_failed" ||
          value === "invalid"
        ? "red"
        : value === "pending" || value === "planned"
          ? "purple"
          : value === "duplicate"
            ? "amber"
            : "neutral";

  return <Badge tone={tone}>{formatRunStatus(value)}</Badge>;
}
