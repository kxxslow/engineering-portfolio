import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileClock,
  GitCompare,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import type {
  IdempotencyKey,
  OperationLog,
  SourceRecord,
  SyncRun,
  SyncRunItem,
  TargetRecord,
} from "@/db/schema";
import {
  executeLatestDryRunAction,
  runDryRunAction,
  retryRunAction,
} from "@/lib/actions";
import {
  formatCurrency,
  formatDateTime,
  formatOperationEvent,
  formatRunKind,
  formatRunStatus,
} from "@/lib/sync-utils";

export function MetricCards({
  metrics,
}: {
  metrics: {
    sourceRows: number;
    targetRows: number;
    readyRows: number;
    failedRows: number;
    writeReferences: number;
  };
}) {
  const cards = [
    {
      label: "Source rows",
      value: metrics.sourceRows,
      hint: "Channel import rows",
      icon: Database,
      tone: "text-violet-600",
    },
    {
      label: "Ready rows",
      value: metrics.readyRows,
      hint: "Latest dry-run rows ready to execute",
      icon: GitCompare,
      tone: "text-violet-600",
    },
    {
      label: "Failed rows",
      value: metrics.failedRows,
      hint: "Carrier hold or row exception",
      icon: AlertTriangle,
      tone: "text-rose-600",
    },
    {
      label: "Write refs",
      value: metrics.writeReferences,
      hint: "Recorded applied writes",
      icon: FileClock,
      tone: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
                    {card.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {card.value}
                  </div>
                </div>
                <Icon className={`h-5 w-5 ${card.tone}`} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {card.hint}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ActionPanel({
  latestDryRun,
  latestExecution,
}: {
  latestDryRun: SyncRun | null;
  latestExecution: SyncRun | null;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-slate-950">Sync actions</div>
        <p className="mt-1 text-xs text-slate-500">
          Actions record runs, row outcomes, logs, and target record changes.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={runDryRunAction}>
          <Button className="w-full">
            <GitCompare className="h-4 w-4" />
            Run dry run
          </Button>
        </form>
        <form action={executeLatestDryRunAction}>
          <Button
            className="w-full"
            variant="secondary"
            disabled={!latestDryRun}
          >
            <RefreshCw className="h-4 w-4" />
            Execute ready rows
          </Button>
        </form>
        <form action={retryRunAction}>
          <input
            type="hidden"
            name="parentRunId"
            value={latestExecution?.id ?? ""}
          />
          <Button
            className="w-full"
            variant="secondary"
            disabled={
              !latestExecution || latestExecution.status !== "partially_failed"
            }
          >
            <RotateCcw className="h-4 w-4" />
            Retry failed rows
          </Button>
        </form>
        <p className="text-xs leading-5 text-slate-500">
          Disabled actions are waiting for the required previous run.
        </p>
      </CardContent>
    </Card>
  );
}

export function DiffTable({ items }: { items: SyncRunItem[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-950">Diff rows</div>
          <p className="mt-1 text-xs text-slate-500">
            Create/update rows are ready for execution; skipped and invalid rows
            stay out of the write path.
          </p>
        </div>
        <Badge tone="purple">{items.length} rows</Badge>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>SKU</Th>
              <Th>Action</Th>
              <Th>Status</Th>
              <Th>Reason</Th>
              <Th>Write reference</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={
                  item.status === "failed" ? "bg-rose-50/60" : undefined
                }
              >
                <Td>
                  <div className="font-semibold text-slate-900">{item.sku}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.sourceRecordId}
                  </div>
                </Td>
                <Td>
                  <Badge
                    tone={
                      item.action === "create"
                        ? "green"
                        : item.action === "update"
                          ? "blue"
                          : item.action === "fail"
                            ? "red"
                            : "neutral"
                    }
                  >
                    {item.action}
                  </Badge>
                </Td>
                <Td>
                  <StatusBadge value={item.status} />
                </Td>
                <Td className="max-w-[320px] text-sm leading-6">
                  {item.reason}
                </Td>
                <Td>
                  <div className="font-mono text-xs text-slate-700">
                    {item.payloadHash ?? "excluded"}
                  </div>
                  <div className="mt-1 max-w-[280px] truncate font-mono text-[11px] text-slate-500">
                    {item.idempotencyKey
                      ? "write reference ready"
                      : "no destination write"}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

export function RunsTable({ runs }: { runs: SyncRun[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="text-sm font-semibold text-slate-950">Run history</div>
      </CardHeader>
      <Table>
        <thead>
          <tr>
            <Th>Run</Th>
            <Th>Kind</Th>
            <Th>Status</Th>
            <Th>Counts</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <Td>
                <Link
                  href={`/runs/${run.id}`}
                  className="font-semibold text-violet-700"
                >
                  {run.id}
                </Link>
                <div className="mt-1 text-xs text-slate-500">
                  Parent: {run.parentRunId ?? "none"}
                </div>
              </Td>
              <Td>{formatRunKind(run.kind)}</Td>
              <Td>
                <StatusBadge value={run.status} />
              </Td>
              <Td>
                <div className="text-xs text-slate-600">
                  +{run.createCount} / Δ{run.updateCount} / skip {run.skipCount}{" "}
                  / fail {run.failCount}
                </div>
              </Td>
              <Td>{formatDateTime(run.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export function RecordsTables({
  sources,
  targets,
}: {
  sources: SourceRecord[];
  targets: TargetRecord[];
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <RecordTable title="Source records" records={sources} mode="source" />
      <RecordTable title="Target records" records={targets} mode="target" />
    </div>
  );
}

function RecordTable({
  title,
  records,
  mode,
}: {
  title: string;
  records: Array<SourceRecord | TargetRecord>;
  mode: "source" | "target";
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="text-sm font-semibold text-slate-950">{title}</div>
      </CardHeader>
      <Table>
        <thead>
          <tr>
            <Th>SKU</Th>
            <Th>Product</Th>
            <Th>Price</Th>
            <Th>Inventory</Th>
            <Th>{mode === "target" ? "Version" : "Row"}</Th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <Td>
                <div className="font-semibold text-slate-900">
                  {record.sku || "invalid source SKU"}
                </div>
                <StatusBadge value={record.status} />
              </Td>
              <Td>
                <div className="font-medium text-slate-800">{record.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {record.category}
                </div>
              </Td>
              <Td>{formatRecordPrice(record.priceCents)}</Td>
              <Td>{record.inventory}</Td>
              <Td>
                {"remoteVersion" in record
                  ? record.remoteVersion
                  : record.rowNumber}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export function LedgerPanel({
  ledger,
  logs,
}: {
  ledger: IdempotencyKey[];
  logs: OperationLog[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <FileClock className="h-4 w-4 text-violet-600" />
          Operation ledger
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Applied writes are recorded once before retry.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {ledger.slice(0, 5).map((entry) => (
          <div
            key={entry.key}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div className="text-xs font-semibold text-slate-800">
              {formatWriteReference(entry)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {entry.targetRecordId} · fingerprint {entry.payloadHash}
            </div>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-3">
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="mb-3 text-xs leading-5 text-slate-600">
              <span
                className={
                  log.level === "warn"
                    ? "font-semibold text-rose-700"
                    : "font-semibold text-slate-800"
                }
              >
                {formatOperationEvent(log.event)}
              </span>{" "}
              {log.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatWriteReference(entry: IdempotencyKey) {
  const [, action = "write", sku = entry.targetRecordId] = entry.key.split(":");
  const retryPrefix = entry.runItemId.includes("retry") ? "retry " : "";

  return `${sku} ${retryPrefix}${action} write`;
}

function formatRecordPrice(priceCents: number) {
  return priceCents < 0 ? "Invalid price" : formatCurrency(priceCents);
}

export function DiffPlanPanel({
  items,
  latestDryRun,
}: {
  items: SyncRunItem[];
  latestDryRun: SyncRun | null;
}) {
  const ready = items.filter((item) => item.status === "pending").length;
  const skipped = items.filter((item) => item.status === "skipped").length;
  const invalid = items.filter((item) => item.status === "invalid").length;
  const create = items.filter((item) => item.action === "create").length;
  const update = items.filter((item) => item.action === "update").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <GitCompare className="h-4 w-4 text-violet-600" />
          Plan summary
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Latest dry run only. Execution history lives in Run log.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <SummaryStat label="Ready" value={ready} tone="text-violet-700" />
          <SummaryStat label="Skipped" value={skipped} tone="text-slate-700" />
          <SummaryStat label="Invalid" value={invalid} tone="text-rose-700" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <div className="font-semibold text-slate-800">
            {create} creates · {update} updates
          </div>
          <div className="mt-1">
            {latestDryRun
              ? `${latestDryRun.id} · ${formatDateTime(latestDryRun.createdAt)}`
              : "Run a dry run to create an executable plan."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSummaryPanel({
  latestDryRun,
  latestExecution,
  ledger,
  logs,
}: {
  latestDryRun: SyncRun | null;
  latestExecution: SyncRun | null;
  ledger: IdempotencyKey[];
  logs: OperationLog[];
}) {
  const recentLog = logs[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Current state
        </div>
        <p className="mt-1 text-xs text-slate-500">
          One concise view of planning, execution, and protected writes.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
        <StateLine
          label="Dry run"
          value={latestDryRun ? formatRunStatus(latestDryRun.status) : "not run"}
        />
        <StateLine
          label="Latest write"
          value={
            latestExecution
              ? formatRunStatus(latestExecution.status)
              : "waiting for execution"
          }
        />
        <StateLine label="Write refs" value={`${ledger.length} recorded`} />
        {recentLog ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5">
            <span className="font-semibold text-slate-800">
              {formatOperationEvent(recentLog.event)}
            </span>{" "}
            {recentLog.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function RecordsSummaryPanel({
  targets,
  latestExecution,
  ledger,
}: {
  targets: TargetRecord[];
  latestExecution: SyncRun | null;
  ledger: IdempotencyKey[];
}) {
  const targetValue = formatCurrency(
    targets.reduce(
      (sum, record) => sum + record.priceCents * record.inventory,
      0,
    ),
  );
  const latestTargets = targets.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Database className="h-4 w-4 text-violet-600" />
          Target summary
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Destination state after applied and retried rows.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <SummaryStat label="Target rows" value={targets.length} />
          <SummaryStat label="Write refs" value={ledger.length} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
            Target value
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-950">
            {targetValue}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {latestExecution
              ? `${formatRunKind(latestExecution.kind)} · ${formatRunStatus(latestExecution.status)}`
              : "No write run yet"}
          </div>
        </div>
        <div className="space-y-2">
          {latestTargets.map((target) => (
            <div
              key={target.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  {target.sku}
                </div>
                <StatusBadge value={target.status} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                v{target.remoteVersion} · {target.lastPayloadHash}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  tone = "text-slate-950",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function StateLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
