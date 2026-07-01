import { formatDateTime } from "../lib/format";
import { getReviewedCases } from "../lib/view-models";
import { StatusBadge, type StatusTone } from "./StatusBadge";

export function ReviewDecisionTable() {
  const cases = getReviewedCases();

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Draft status</th>
            <th>Review action</th>
            <th>Reviewed result</th>
            <th>Review rule</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((item, index) => (
            <tr
              className={
                isCritical(item.reviewedDraft.status)
                  ? "isCritical"
                  : index === 0
                    ? "isHighlighted"
                    : undefined
              }
              key={item.ticket.id}
            >
              <td>
                <strong>{item.ticket.subject}</strong>
                <p className="subtle">{item.ticket.customerName}</p>
              </td>
              <td>
                <StatusBadge
                  label={item.draft.status}
                  tone={toneForStatus(item.draft.status)}
                />
              </td>
              <td>
                {item.decision ? (
                  <>
                    <strong>{decisionLabel(item.decision.decision, item.reviewedDraft.status)}</strong>
                    <p className="subtle">
                      {formatDateTime(item.decision.decidedAt)}
                    </p>
                  </>
                ) : (
                  <span className="subtle">No decision</span>
                )}
              </td>
              <td>
                <StatusBadge
                  label={item.reviewedDraft.status}
                  tone={toneForStatus(item.reviewedDraft.status)}
                />
              </td>
              <td>{guardrailFor(item.reviewedDraft.status)}</td>
              <td>
                {item.reviewedDraft.reviewerNotes ??
                  item.decision?.notes ??
                  "Waiting for reviewer."}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isCritical(status: string): boolean {
  return (
    status === "blocked" || status === "escalated" || status === "rejected"
  );
}

function guardrailFor(status: string): string {
  if (status === "approved") {
    return "All claims have citations and no escalation is required.";
  }

  if (status === "needs_edits") {
    return "Reviewer edits are open, so approval stays held.";
  }

  if (status === "escalated") {
    return "Missing evidence moves to human escalation instead of a confident answer.";
  }

  return "Reviewer action is still required.";
}

function decisionLabel(decision: string, reviewedStatus: string): string {
  if (reviewedStatus === "needs_edits") {
    return "request edits";
  }

  if (decision === "approve") {
    return "approve";
  }

  return decision.replaceAll("_", " ");
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
