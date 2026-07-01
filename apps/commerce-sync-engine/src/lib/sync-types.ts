export type ProductStatus = "active" | "draft" | "archived";
export type DiffAction = "create" | "update" | "skip" | "fail";
export type RunKind = "dry_run" | "execute" | "retry";
export type RunStatus = "planned" | "completed" | "partially_failed";
export type ItemStatus =
  | "pending"
  | "applied"
  | "failed"
  | "skipped"
  | "invalid"
  | "duplicate";

export type ProductPayload = {
  sku: string;
  title: string;
  priceCents: number;
  inventory: number;
  status: string;
  category: string;
};

export type FieldChange = {
  field: keyof ProductPayload;
  before: string | number | undefined;
  after: string | number;
};

export type ClassifiedDiff = {
  sourceRecordId: string;
  targetRecordId: string | null;
  sku: string;
  action: DiffAction;
  status: ItemStatus;
  reason: string;
  payloadHash: string | null;
  idempotencyKey: string | null;
  before: ProductPayload | null;
  after: ProductPayload | null;
  changes: FieldChange[];
};
