import { AppShell } from "@/components/app-shell";
import { LedgerPanel, RunsTable } from "@/components/commerce-widgets";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { formatOperationEvent } from "@/lib/sync-utils";
import { getCommerceSnapshot } from "@/lib/view-models";

export const dynamic = "force-dynamic";

export default function LogPage() {
  const snapshot = getCommerceSnapshot();

  return (
    <AppShell context="Operation log" path="/log">
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
        <div className="space-y-5">
          <RunsTable runs={snapshot.runs} />
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="text-sm font-semibold text-slate-950">
                Execution events
              </div>
            </CardHeader>
            <Table>
              <thead>
                <tr>
                  <Th>Event</Th>
                  <Th>Run</Th>
                  <Th>Level</Th>
                  <Th>Message</Th>
                </tr>
              </thead>
              <tbody>
                {snapshot.logs.map((log) => (
                  <tr key={log.id}>
                    <Td className="font-semibold text-slate-900">
                      {formatOperationEvent(log.event)}
                    </Td>
                    <Td>{log.runId}</Td>
                    <Td>{log.level}</Td>
                    <Td>{log.message}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
        <div className="space-y-5">
          <LedgerPanel ledger={snapshot.ledger} logs={snapshot.logs} />
        </div>
      </div>
    </AppShell>
  );
}
