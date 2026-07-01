import { RotateCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  ActionPanel,
  DashboardSummaryPanel,
  DiffTable,
  MetricCards,
  RecordsTables,
  RunsTable,
} from "@/components/commerce-widgets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { resetDemoAction } from "@/lib/actions";
import { getCommerceSnapshot } from "@/lib/view-models";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const snapshot = getCommerceSnapshot();
  const latestDryRunItems = snapshot.latestDryRun
    ? snapshot.items.filter((item) => item.runId === snapshot.latestDryRun?.id)
    : [];

  return (
    <AppShell context="Sync dashboard" path="/">
      <div className="space-y-5">
        <MetricCards metrics={snapshot.metrics} />
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="space-y-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Source to target operations
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Current source and destination states are recorded for
                    comparison.
                  </p>
                </div>
                <form action={resetDemoAction}>
                  <Button variant="secondary">
                    <RotateCcw className="h-4 w-4" />
                    Restore sample state
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <RecordsTables
                  sources={snapshot.sources}
                  targets={snapshot.targets}
                />
              </CardContent>
            </Card>
            <DiffTable items={latestDryRunItems} />
            <RunsTable runs={snapshot.runs} />
          </div>
          <div className="space-y-5">
            <ActionPanel
              latestDryRun={snapshot.latestDryRun}
              latestExecution={snapshot.latestExecution}
            />
            <DashboardSummaryPanel
              latestDryRun={snapshot.latestDryRun}
              latestExecution={snapshot.latestExecution}
              ledger={snapshot.ledger}
              logs={snapshot.logs}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
