import Link from "next/link";
import { AppShell } from "../../src/components/AppShell";
import {
  DetailRows,
  ConsoleTitle,
  ConsoleWorkspace,
} from "../../src/components/ConsoleWorkspace";
import { StatusBadge, type StatusTone } from "../../src/components/StatusBadge";
import { Button } from "../../src/components/ui/button";
import { evaluateDraftAction, reviewDecisionAction } from "../../src/lib/actions";
import { formatDateTime } from "../../src/lib/format";
import { getApprovalState } from "../../src/lib/review-policy";
import { getReviewedCases } from "../../src/lib/view-models";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const cases = getReviewedCases();
  const focusCase =
    cases.find((item) => item.draft.id === params?.draft) ??
    cases.find((item) => item.reviewedDraft.status !== "approved") ??
    cases[0];
  const approvalState = getApprovalState(focusCase);
  const unsupportedCount = cases.reduce(
    (total, item) => total + item.draft.unsupportedClaims.length,
    0,
  );
  const coverage = focusCase.groundingCheck.totalClaimCount
    ? Math.round(
        (focusCase.groundingCheck.supportedClaimCount /
          focusCase.groundingCheck.totalClaimCount) *
          100,
      )
    : 0;

  return (
    <AppShell
      eyebrow="Answer review"
      title="Answer Review"
      meta="Draft answers, citations, and reviewer actions."
      topbarItems={[
        { label: `${cases.length} active drafts`, tone: "blue" },
        {
          label: `Unsupported ${unsupportedCount}`,
          tone: unsupportedCount > 0 ? "amber" : "green",
        },
        { label: `Citation coverage ${coverage}%`, tone: coverage >= 90 ? "green" : "amber" },
      ]}
    >
      <ConsoleWorkspace
        filterTitle="Review queue"
        filterSubtitle="Status scope"
        sections={[
          {
            title: "Review queue",
            items: [
              { label: "Current", value: cases.length, tone: "blue", active: true },
              {
                label: "Needs edit",
                value: cases.filter((item) => item.reviewedDraft.status === "needs_edits")
                  .length,
                tone: "amber",
              },
              {
                label: "Blocked",
                value: cases.filter((item) =>
                  ["blocked", "escalated", "rejected"].includes(item.reviewedDraft.status),
                ).length,
                tone: "red",
              },
              {
                label: "Approved",
                value: cases.filter((item) => item.reviewedDraft.status === "approved").length,
                tone: "green",
              },
            ],
          },
        ]}
        inspector={
          <ReviewerActionPanel
            approvalState={approvalState}
            coverage={coverage}
            focusCase={focusCase}
          />
        }
      >
        <div className="draftReviewGrid">
          <section>
            <ConsoleTitle title="Review cases" />
            <div className="reviewCaseList">
              {cases.map((item) => (
                <Link
                  className={
                    item.draft.id === focusCase.draft.id
                      ? "reviewCaseCard selected"
                      : "reviewCaseCard"
                  }
                  href={`/assistant?draft=${item.draft.id}`}
                  key={item.draft.id}
                >
                  <div>
                    <strong>{caseTitle(item.ticket.subject)}</strong>
                    <span className="tableMeta">
                      {evidenceLabel(item.groundingCheck.result)} /{" "}
                      {item.reviewedDraft.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <StatusBadge
                    label={item.reviewedDraft.status.replaceAll("_", " ")}
                    tone={toneForStatus(item.reviewedDraft.status)}
                  />
                </Link>
              ))}
            </div>
          </section>

          <section>
            <span className="consoleInspectorLabel">Answer review</span>
            <div className="panelHeader" style={{ marginBottom: 18 }}>
              <div>
                <h2>{focusCase.ticket.subject}</h2>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  {focusCase.ticket.id} / answer draft / updated{" "}
                  {formatDateTime(focusCase.draft.createdAt)}
                </p>
              </div>
              <StatusBadge
                label={evidenceLabel(focusCase.groundingCheck.result)}
                tone={toneForResult(focusCase.groundingCheck.result)}
              />
            </div>

            <div className="draftAnswerBox">
              <strong>Draft answer</strong>
              <p style={{ marginBottom: 0, marginTop: 16 }}>
                {focusCase.draft.answerText}
              </p>
            </div>

            <ConsoleTitle title="Evidence coverage" meta="linked source facts" />
            <div className="tableWrap">
              <table className="denseTable">
                <thead>
                  <tr>
                    <th>Fact</th>
                    <th>Source</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {focusCase.draft.citations.length > 0 ? (
                    focusCase.draft.citations.map((citation) => (
                      <tr key={citation.id}>
                        <td>
                          <strong>{citation.factId}</strong>
                          <span className="tableMeta">{citation.quote}</span>
                        </td>
                        <td>{citation.label}</td>
                        <td>
                          <StatusBadge label="used" tone="green" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="warningRow">
                      <td colSpan={3}>No citations attached to this answer.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="consoleBlock">
              <ConsoleTitle title="Unsupported claims" meta="review required" />
              {focusCase.draft.unsupportedClaims.length > 0 ? (
                <div className="consoleQueue">
                  {focusCase.draft.unsupportedClaims.map((claim) => (
                    <div className="queueRow" key={claim.id}>
                      <div>
                        <strong>{claim.text}</strong>
                        <span className="tableMeta">
                          Missing {claim.missingFactIds.join(", ")}
                        </span>
                      </div>
                      <StatusBadge label={claim.riskLevel} tone="amber" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="consoleQueue">
                  <strong>No unsupported claims on selected answer</strong>
                  <span className="tableMeta">
                    All answer claims are linked to approved source facts.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </ConsoleWorkspace>
    </AppShell>
  );
}

function ReviewerActionPanel({
  approvalState,
  coverage,
  focusCase,
}: {
  approvalState: ReturnType<typeof getApprovalState>;
  coverage: number;
  focusCase: ReturnType<typeof getReviewedCases>[number];
}) {
  return (
    <>
      <span className="consoleInspectorLabel">Decision panel</span>
      <h2>Reviewer action</h2>
      <div className="decisionActions" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
        <form action={evaluateDraftAction}>
          <input name="draftId" type="hidden" value={focusCase.draft.id} />
          <Button className="secondaryAction" type="submit" variant="outline">
            Evaluate
          </Button>
        </form>
        <form action={reviewDecisionAction}>
          <input name="draftId" type="hidden" value={focusCase.draft.id} />
          <input name="decision" type="hidden" value="approve" />
          <Button
            className={approvalState.canApprove ? "primaryAction" : "unavailableAction"}
            disabled={!approvalState.canApprove}
            type="submit"
          >
            {approvalState.label}
          </Button>
        </form>
        <form action={reviewDecisionAction}>
          <input name="draftId" type="hidden" value={focusCase.draft.id} />
          <input name="decision" type="hidden" value="request_edits" />
          <Button className="secondaryAction" type="submit" variant="outline">
            Request edit
          </Button>
        </form>
        <form action={reviewDecisionAction}>
          <input name="draftId" type="hidden" value={focusCase.draft.id} />
          <input name="decision" type="hidden" value="escalate" />
          <Button className="dangerAction" type="submit" variant="destructive">
            Block reply
          </Button>
        </form>
      </div>

      {!approvalState.canApprove && approvalState.reason ? (
        <div className="approvalNotice compact" role="note">
          {approvalState.reason}
        </div>
      ) : null}

      <div className="consoleBlock">
        <ConsoleTitle title="Readiness" meta="current checks" />
        <DetailRows
          rows={[
            {
              label: "Citation coverage",
              value: `${coverage}%`,
            },
            {
              label: "Unsupported claims",
              value: focusCase.draft.unsupportedClaims.length,
            },
            {
              label: "Source freshness",
              value: "Within policy",
            },
            {
              label: "Reviewer note",
              value: focusCase.reviewedDraft.reviewerNotes ?? "No reviewer note",
            },
          ]}
        />
      </div>

      <div className="consoleBlock">
        <ConsoleTitle title="Decision log" meta="last events" />
        <div className="consoleCardList">
          {focusCase.auditTrail.slice(0, 4).map((event) => (
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

function caseTitle(subject: string) {
  if (subject.includes("Promo")) {
    return "Discount question";
  }

  if (subject.includes("Password")) {
    return "Account export";
  }

  if (subject.includes("Delivery")) {
    return "Shipping delay";
  }

  if (subject.includes("Damaged")) {
    return "Damage replacement";
  }

  if (subject.includes("Warranty")) {
    return "Warranty check";
  }

  if (subject.includes("Gift")) {
    return "Gift card balance";
  }

  if (subject.includes("VAT")) {
    return "Invoice receipt";
  }

  if (subject.includes("Address")) {
    return "Address change";
  }

  return "Return request";
}

function evidenceLabel(result: string) {
  return result === "passed" ? "Evidence passed" : result.replaceAll("_", " ");
}

function toneForResult(result: string): StatusTone {
  if (result === "passed") {
    return "green";
  }

  if (result === "blocked") {
    return "red";
  }

  return "amber";
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
