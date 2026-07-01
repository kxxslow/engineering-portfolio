import { Badge } from "./ui/badge";

export type StatusTone = "green" | "blue" | "red" | "amber" | "muted";

export function StatusBadge({
  label,
  tone
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <Badge className={`statusBadge badge${capitalize(tone)}`} variant="outline">
      {label.replaceAll("_", " ")}
    </Badge>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
