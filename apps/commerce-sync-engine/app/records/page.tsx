import { AppShell } from "@/components/app-shell";
import {
  RecordsSummaryPanel,
  RecordsTables,
} from "@/components/commerce-widgets";
import { getCommerceSnapshot } from "@/lib/view-models";

export const dynamic = "force-dynamic";

export default function RecordsPage() {
  const snapshot = getCommerceSnapshot();

  return (
    <AppShell context="Source and target records" path="/records">
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
        <RecordsTables sources={snapshot.sources} targets={snapshot.targets} />
        <div className="space-y-5">
          <RecordsSummaryPanel
            targets={snapshot.targets}
            latestExecution={snapshot.latestExecution}
            ledger={snapshot.ledger}
          />
        </div>
      </div>
    </AppShell>
  );
}
