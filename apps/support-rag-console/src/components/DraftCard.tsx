import { AlertTriangle } from "lucide-react";
import type { DraftGenerationResult } from "../lib/rag";
import { evaluateDraftAction, reviewDecisionAction } from "../lib/actions";
import { getApprovalState } from "../lib/review-policy";
import { StatusBadge, type StatusTone } from "./StatusBadge";
import { Button } from "./ui/button";

export function DraftCard({ result }: { result: DraftGenerationResult }) {
  const { draft, groundingCheck, ticket } = result;
  const approvalState = getApprovalState(result);

  return (
    <div className="draftStack">
      <div className="panelHeader">
        <div>
          <h2>{ticket.subject}</h2>
          <p className="subtle">{ticket.customerName}</p>
        </div>
        <div className="badgeRow">
          <StatusBadge label={draft.status} tone={toneForStatus(draft.status)} />
          <StatusBadge label={`${draft.confidence} confidence`} tone={toneForConfidence(draft.confidence)} />
        </div>
      </div>

      <p className="answerText">{draft.answerText}</p>

      <dl className="detailList compactDetails">
        <div className="detailRow">
          <dt>Evidence result</dt>
          <dd>{formatEvidenceResult(groundingCheck.result)}</dd>
        </div>
        <div className="detailRow">
          <dt>Claim support</dt>
          <dd>
            {groundingCheck.supportedClaimCount} of {groundingCheck.totalClaimCount} claims supported
          </dd>
        </div>
        <div className="detailRow">
          <dt>Risk</dt>
          <dd>{draft.riskLevel}</dd>
        </div>
        <div className="detailRow">
          <dt>Escalation</dt>
          <dd>{draft.escalationStatus}</dd>
        </div>
      </dl>

      {draft.unsupportedClaims.length > 0 ? (
        <div className="warningBox">
          <h3 className="iconTitle">
            <AlertTriangle aria-hidden="true" size={15} />
            Unsupported claims
          </h3>
          <ul className="plainList">
            {draft.unsupportedClaims.map((claim) => (
              <li key={claim.id}>
                {claim.text}
                <span className="inlineMeta">missing {claim.missingFactIds.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!approvalState.canApprove && approvalState.reason ? (
        <div className="approvalNotice" role="note">
          {approvalState.reason}
        </div>
      ) : null}

      <div className="decisionActions" aria-label="Reviewer decision controls">
        <form action={evaluateDraftAction}>
          <input type="hidden" name="draftId" value={draft.id} />
          <Button className="secondaryAction" type="submit" variant="outline">
            Re-evaluate
          </Button>
        </form>
        <form action={reviewDecisionAction}>
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="decision" value="approve" />
          <Button
            className={
              approvalState.canApprove ? "primaryAction" : "unavailableAction"
            }
            disabled={!approvalState.canApprove}
            type="submit"
          >
            {approvalState.label}
          </Button>
        </form>
        <form action={reviewDecisionAction}>
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="decision" value="request_edits" />
          <Button className="secondaryAction" type="submit" variant="outline">
            Request edit
          </Button>
        </form>
        <form action={reviewDecisionAction}>
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="decision" value="escalate" />
          <Button className="dangerAction" type="submit" variant="destructive">
            Block reply
          </Button>
        </form>
      </div>
    </div>
  );
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

function toneForConfidence(confidence: string): StatusTone {
  if (confidence === "high") {
    return "blue";
  }

  if (confidence === "medium") {
    return "amber";
  }

  return "red";
}

function formatEvidenceResult(result: string): string {
  if (result === "passed") {
    return "evidence passed";
  }

  return result.replaceAll("_", " ");
}
