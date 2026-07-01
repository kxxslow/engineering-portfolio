import { notFound } from "next/navigation";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Quote,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { AppShell } from "../../../src/components/AppShell";
import { DraftCard } from "../../../src/components/DraftCard";
import { EvidenceInspector } from "../../../src/components/EvidenceInspector";
import {
  StatusBadge,
  type StatusTone,
} from "../../../src/components/StatusBadge";
import { Button } from "../../../src/components/ui/button";
import { formatDateTime } from "../../../src/lib/format";
import { reviewDecisionAction } from "../../../src/lib/actions";
import { getApprovalState } from "../../../src/lib/review-policy";
import {
  getGeneratedCaseByDraftId,
  getGeneratedCases,
  getReviewedCases,
} from "../../../src/lib/view-models";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getGeneratedCases().map((item) => ({ draftId: item.draft.id }));
}

export default async function AnswerInspectorPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const result = getGeneratedCaseByDraftId(draftId);

  if (!result) {
    notFound();
  }

  const reviewed = getReviewedCases().find(
    (item) => item.draft.id === result.draft.id,
  );
  const reviewedDraft = reviewed?.reviewedDraft ?? result.draft;
  const decision = reviewed?.decision;
  const unsupportedCount = result.draft.unsupportedClaims.length;
  const citationCount = result.draft.citations.length;
  const approvalState = getApprovalState(result);

  return (
    <AppShell
      eyebrow="Answer evidence"
      title={result.draft.id}
      meta={result.ticket.subject}
    >
      <section
        className="grid detailMetrics"
        aria-label="Answer evidence metrics"
      >
        <Metric
          icon={Quote}
          label="Citations"
          value={citationCount}
          hint="Source-backed claims"
        />
        <Metric
          icon={CheckCircle2}
          label="Claim support"
          value={`${result.groundingCheck.supportedClaimCount}/${result.groundingCheck.totalClaimCount}`}
          hint="Evidence coverage"
        />
        <Metric
          icon={ShieldAlert}
          label="Unsupported"
          value={unsupportedCount}
          hint="Blocked from send path"
        />
        <Metric
          icon={UserCheck}
          label="Review state"
          value={reviewedDraft.status.replaceAll("_", " ")}
          hint="Human decision rule"
        />
      </section>

      <section className="answerDetailLayout">
        <div className="grid railStack">
          <div className="panel">
            <DraftCard result={result} />
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Evidence inspector</h2>
                <p className="subtle">
                  Retrieved snippets, citations, and source facts used by the
                  draft.
                </p>
              </div>
              <StatusBadge
                label={`${result.retrievedSources.length} sources`}
                tone={result.retrievedSources.length > 0 ? "green" : "red"}
              />
            </div>
            <EvidenceInspector result={result} />
          </div>
        </div>

        <aside className="grid railStack">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Ticket context</h2>
                <p className="subtle">
                  {formatDateTime(result.ticket.createdAt)}
                </p>
              </div>
              <StatusBadge
                label={result.ticket.priority}
                tone={result.ticket.priority === "high" ? "amber" : "blue"}
              />
            </div>
            <dl className="detailList">
              <div className="detailRow">
                <dt>Customer</dt>
                <dd>{result.ticket.customerName}</dd>
              </div>
              <div className="detailRow">
                <dt>Channel</dt>
                <dd>{result.ticket.channel}</dd>
              </div>
              <div className="detailRow">
                <dt>Intent</dt>
                <dd>{result.ticket.intent.replaceAll("_", " ")}</dd>
              </div>
            </dl>
            <p className="footerNote">
              <Link className="linkText" href={`/tickets/${result.ticket.id}`}>
                Back to ticket
              </Link>
            </p>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Evidence check</h2>
                <p className="subtle">{result.groundingCheck.rationale}</p>
              </div>
              <StatusBadge
                label={`${result.groundingCheck.qualityScore}% quality`}
                tone={toneForScore(result.groundingCheck.qualityScore)}
              />
            </div>
            <dl className="detailList">
              <div className="detailRow">
                <dt>Relevant sources</dt>
                <dd>{result.groundingCheck.relevantSourceCount}</dd>
              </div>
              <div className="detailRow">
                <dt>Supported claims</dt>
                <dd>
                  {result.groundingCheck.supportedClaimCount} of{" "}
                  {result.groundingCheck.totalClaimCount}
                </dd>
              </div>
              <div className="detailRow">
                <dt>Risk level</dt>
                <dd>{result.groundingCheck.riskLevel}</dd>
              </div>
            </dl>
          </div>

          {reviewed?.evaluationHistory ? (
            <div className="panel">
              <div className="panelHeader">
                <h2>Evaluation history</h2>
                <StatusBadge
                  label={`${reviewed.evaluationHistory.length} checks`}
                  tone="blue"
                />
              </div>
              <div className="splitList">
                {reviewed.evaluationHistory.slice(0, 4).map((evaluation) => (
                  <div className="railSummary" key={evaluation.id}>
                    <strong>{evaluation.result.replaceAll("_", " ")}</strong>
                    <p className="subtle" style={{ marginBottom: 0 }}>
                      {evaluation.supportedClaimCount}/
                      {evaluation.totalClaimCount} claims ·{" "}
                      {evaluation.qualityScore}% quality
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="panel">
            <div className="panelHeader">
              <h2>Reviewer decision</h2>
              <StatusBadge
                label={reviewedDraft.status}
                tone={toneForStatus(reviewedDraft.status)}
              />
            </div>
            {unsupportedCount > 0 ? (
              <div className="warningBox">
                <h3 className="iconTitle">
                  <AlertTriangle aria-hidden="true" size={15} />
                  Review rule active
                </h3>
                <p style={{ marginBottom: 0 }}>
                  Unsupported claims remain out of the send-ready path until
                  evidence or edits resolve them.
                </p>
              </div>
            ) : (
              <div className="railSummary">
                <strong className="iconTitle">
                  <CheckCircle2 aria-hidden="true" size={15} />
                  {approvalState.canApprove ? "Ready for approval" : approvalState.label}
                </strong>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  {approvalState.canApprove
                    ? "All planned claims map to cited source facts before a reviewer can approve."
                    : (approvalState.reason ??
                      "A reviewer decision is required before this answer can move forward.")}
                </p>
              </div>
            )}
            {decision ? (
              <p className="footerNote">
                {decision.reviewerName}: {decision.notes}
              </p>
            ) : null}
            {!approvalState.canApprove && approvalState.reason ? (
              <p className="approvalNotice compact" role="note">
                {approvalState.reason}
              </p>
            ) : null}
            <div
              className="buttonRow"
              style={{ marginBottom: 0, marginTop: 14 }}
            >
              <form action={reviewDecisionAction}>
                <input type="hidden" name="draftId" value={result.draft.id} />
                <input type="hidden" name="decision" value="approve" />
                <Button
                  className={
                    approvalState.canApprove
                      ? "primaryAction"
                      : "unavailableAction"
                  }
                  disabled={!approvalState.canApprove}
                  size="sm"
                  type="submit"
                >
                  {approvalState.label}
                </Button>
              </form>
              <form action={reviewDecisionAction}>
                <input type="hidden" name="draftId" value={result.draft.id} />
                <input type="hidden" name="decision" value="request_edits" />
                <Button
                  className="secondaryAction"
                  size="sm"
                  type="submit"
                  variant="outline"
                >
                  Request edit
                </Button>
              </form>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function toneForScore(score: number): StatusTone {
  if (score === 100) {
    return "green";
  }

  if (score > 0) {
    return "amber";
  }

  return "red";
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

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="metric">
      <span className="metricIcon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="metricLabel">{label}</span>
      <span className="metricValue detailMetricValue">{value}</span>
      <span className="metricHint">{hint}</span>
    </div>
  );
}
