import type { ProductPayload } from "@/lib/sync-types";

export function toPayload(record: {
  sku: string;
  title: string;
  priceCents: number;
  inventory: number;
  status: string;
  category: string;
}): ProductPayload {
  return {
    sku: record.sku.trim(),
    title: record.title.trim(),
    priceCents: record.priceCents,
    inventory: record.inventory,
    status: record.status,
    category: record.category.trim(),
  };
}

export function stablePayloadHash(payload: ProductPayload): string {
  const input = [
    payload.sku,
    payload.title,
    payload.priceCents,
    payload.inventory,
    payload.status,
    payload.category,
  ].join("|");

  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function makeIdempotencyKey(
  action: "create" | "update",
  sku: string,
  payloadHash: string,
) {
  return `catalog:${action}:${sku}:${payloadHash}`;
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRunKind(value: string) {
  const labels: Record<string, string> = {
    dry_run: "dry run",
    execute: "execution",
    retry: "retry",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

export function formatRunStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "ready",
    partially_failed: "partial failure",
    duplicate: "write already recorded",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

export function formatOperationEvent(value: string) {
  const labels: Record<string, string> = {
    dry_run_persisted: "Dry run recorded",
    execution_completed: "Execution completed",
    duplicate_prevented: "Write already recorded",
    row_failed: "Row held for retry",
    row_applied: "Row applied",
    retry_completed: "Retry completed",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
