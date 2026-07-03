import Link from "next/link";
import { AppShell } from "../../src/components/AppShell";
import {
  DetailRows,
  ConsoleTitle,
  ConsoleWorkspace,
} from "../../src/components/ConsoleWorkspace";
import { StatusBadge, type StatusTone } from "../../src/components/StatusBadge";
import { formatDateTime } from "../../src/lib/format";
import { getReviewedCases } from "../../src/lib/view-models";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const cases = getReviewedCases();
  const selected =
    cases.find((item) => item.draft.id === params?.draft) ?? cases[0];
  const blockedCount = cases.filter((item) =>
    ["blocked", "escalated", "rejected"].includes(item.reviewedDraft.status),
  ).length;
  const editCount = cases.filter(
    (item) => item.reviewedDraft.status === "needs_edits",
  ).length;

  return (
    <AppShell
      eyebrow="Decision log"
      title="Decision Log"
      meta="Recorded reviewer outcomes after evidence evaluation."
      topbarItems={[
        { label: `${cases.length} decisions`, tone: "blue" },
        { label: `${blockedCount} blocked`, tone: blockedCount > 0 ? "red" : "green" },
        { label: "Audit-ready", tone: "green" },
      ]}
    >
      <ConsoleWorkspace
        filterTitle="Audit scope"
        filterSubtitle="Status scope"
        sections={[
          {
            title: "Audit scope",
            items: [
              { label: "All events", value: cases.length, tone: "blue", active: true },
              {
                label: "Approved",
                value: cases.filter((item) => item.reviewedDraft.status === "approved").length,
                tone: "green",
              },
              { label: "Edits", value: editCount, tone: "amber" },
              { label: "Blocked", value: blockedCount, tone: "red" },
            ],
          },
        ]}
        inspector={<DecisionInspector selected={selected} />}
      >
        <ConsoleTitle
          title="Decision history"
          meta="Immutable review decisions and audit events"
        />
        <div className="tableWrap">
          <table className="denseTable">
            <thead>
              <tr>
                <th>Case</th>
                <th>Decision</th>
                <th>Reviewer</th>
                <th>Evidence</th>
                <th>Unsupported</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => {
                const unsupported = item.draft.unsupportedClaims.length;
                return (
                  <tr
                    className={
                      item.draft.id === selected.draft.id
                        ? "selected"
                        : unsupported > 0
                          ? "warningRow"
                          : undefined
                    }
                    key={item.ticket.id}
                  >
                    <td className="clickableCell">
                      <Link className="tableCellLink" href={`/review?draft=${item.draft.id}`}>
                        <span className="tableCellTitle">{item.ticket.subject}</span>
                        <span className="tableMeta">{item.ticket.customerName}</span>
                      </Link>
                    </td>
                    <td>
                      <StatusBadge
                        label={decisionLabel(item)}
                        tone={toneForStatus(item.reviewedDraft.status)}
                      />
                    </td>
                    <td>{item.decision?.reviewerName ?? "Reviewer"}</td>
                    <td>{evidenceLabel(item.groundingCheck.result)}</td>
                    <td>{unsupported}</td>
                    <td>{formatDateTime(item.decision?.decidedAt ?? item.draft.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ConsoleWorkspace>
    </AppShell>
  );
}

function DecisionInspector({
  selected,
}: {
  selected: ReturnType<typeof getReviewedCases>[number];
}) {
  return (
    <>
      <span className="consoleInspectorLabel">Selected decision</span>
      <div className="panelHeader" style={{ marginBottom: 18 }}>
        <div>
          <h2>{selected.ticket.subject}</h2>
          <p className="subtle" style={{ marginBottom: 0 }}>
            {selected.ticket.customerName}
          </p>
        </div>
        <StatusBadge
          label={decisionLabel(selected)}
          tone={toneForStatus(selected.reviewedDraft.status)}
        />
      </div>

      <ConsoleTitle title="Decision context" meta="audit detail" />
      <DetailRows
        rows={[
          { label: "Decision", value: decisionLabel(selected) },
          { label: "Reviewer", value: selected.decision?.reviewerName ?? "Reviewer" },
          {
            label: "Evidence coverage",
            value: evidenceLabel(selected.groundingCheck.result),
          },
          {
            label: "Unsupported claims",
            value: selected.draft.unsupportedClaims.length,
          },
          {
            label: "Reason",
            value:
              selected.reviewedDraft.reviewerNotes ??
              selected.decision?.notes ??
              "Waiting for reviewer.",
          },
        ]}
      />

      <div className="consoleBlock">
        <ConsoleTitle title="Audit trail" meta="ordered events" />
        <div className="consoleCardList">
          {selected.auditTrail.slice(0, 5).map((event) => (
            <div className="compactCard" key={event.id}>
              <div>
                <strong>{event.event.replaceAll("_", " ")}</strong>
                <span className="tableMeta">{event.message}</span>
              </div>
              <span className="tableMeta">{formatDateTime(event.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function decisionLabel(item: ReturnType<typeof getReviewedCases>[number]) {
  if (item.reviewedDraft.status === "needs_edits") {
    return "Request edit";
  }

  if (item.reviewedDraft.status === "approved") {
    return "Approved";
  }

  if (item.reviewedDraft.status === "escalated") {
    return "Blocked";
  }

  return item.decision?.decision.replaceAll("_", " ") ?? "Review pending";
}

function evidenceLabel(result: string) {
  return result === "passed" ? "passed" : result.replaceAll("_", " ");
}

function toneForStatus(status: string): StatusTone {
  if (status === "approved" || status === "ready_for_review") {
    return "green";
  }

  if (status === "blocked" || status === "escalated" || status === "rejected") {
    return "red";
  }

  if (status === "needs_review" || status === "needs_edits") {
    return "amber";
  }

  return "muted";
}
