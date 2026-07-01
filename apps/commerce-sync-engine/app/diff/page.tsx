import { AppShell } from "@/components/app-shell";
import {
  ActionPanel,
  DiffTable,
  DiffPlanPanel,
  MetricCards,
} from "@/components/commerce-widgets";
import { getCommerceSnapshot } from "@/lib/view-models";

export const dynamic = "force-dynamic";

export default function DiffPage() {
  const snapshot = getCommerceSnapshot();
  const latestDryRunItems = snapshot.latestDryRun
    ? snapshot.items.filter((item) => item.runId === snapshot.latestDryRun?.id)
    : [];

  return (
    <AppShell context="Dry-run diff preview" path="/diff">
      <div className="space-y-5">
        <MetricCards metrics={snapshot.metrics} />
        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="space-y-5">
            <DiffTable items={latestDryRunItems} />
          </div>
          <div className="space-y-5">
            <ActionPanel
              latestDryRun={snapshot.latestDryRun}
              latestExecution={snapshot.latestExecution}
            />
            <DiffPlanPanel
              items={latestDryRunItems}
              latestDryRun={snapshot.latestDryRun}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
