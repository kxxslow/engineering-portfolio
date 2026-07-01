import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import {
  DiffTable,
  LedgerPanel,
} from "@/components/commerce-widgets";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { retryRunAction } from "@/lib/actions";
import { formatRunKind } from "@/lib/sync-utils";
import { getRunDetail } from "@/lib/view-models";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const detail = getRunDetail(runId);

  if (!detail.run) {
    notFound();
  }

  return (
    <AppShell context="Run detail" path="/log">
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
        <div className="space-y-5">
          <Card>
            <CardContent className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {detail.run.id}
                  </h1>
                  <StatusBadge value={detail.run.status} />
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {formatRunKind(detail.run.kind)} · parent{" "}
                  {detail.run.parentRunId ?? "none"}
                </div>
              </div>
              {detail.run.status === "partially_failed" ? (
                <form action={retryRunAction}>
                  <input
                    type="hidden"
                    name="parentRunId"
                    value={detail.run.id}
                  />
                  {detail.run.id === "sync-run-2026-07-15-exec" ? (
                    <input
                      type="hidden"
                      name="retryRunId"
                      value="sync-run-2026-07-15-exec-retry"
                    />
                  ) : null}
                  <Button>Retry failed rows</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
          <DiffTable items={detail.items} />
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="text-sm font-semibold text-slate-950">
                Target state after run
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {detail.targets.map((target) => (
                <div
                  key={target.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="font-semibold text-slate-950">
                    {target.sku}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {target.title}
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    v{target.remoteVersion} · fingerprint{" "}
                    {target.lastPayloadHash}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <LedgerPanel ledger={detail.ledger} logs={detail.logs} />
        </div>
      </div>
    </AppShell>
  );
}
