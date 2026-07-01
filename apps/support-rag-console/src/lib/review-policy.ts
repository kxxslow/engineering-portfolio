import type { DraftGenerationResult } from "./rag";

export function getApprovalState(result: DraftGenerationResult): {
  canApprove: boolean;
  label: string;
  reason: string | null;
} {
  const { draft, groundingCheck } = result;

  if (draft.status === "approved") {
    return {
      canApprove: false,
      label: "Approved",
      reason: "A review decision has already been recorded for this answer."
    };
  }

  if (groundingCheck.result === "blocked") {
    return {
      canApprove: false,
      label: "Approval held",
      reason: "Approval is held until source coverage passes."
    };
  }

  if (draft.unsupportedClaims.length > 0 || groundingCheck.result !== "passed") {
    return {
      canApprove: false,
      label: "Approval held",
      reason: "Resolve unsupported claims before approval."
    };
  }

  if (draft.status === "needs_edits") {
    return {
      canApprove: false,
      label: "Approval held",
      reason: "Approval is held because reviewer edits are still open."
    };
  }

  if (draft.escalationStatus !== "none") {
    return {
      canApprove: false,
      label: "Approval held",
      reason: "Resolve the escalation requirement before approval."
    };
  }

  if (draft.status !== "ready_for_review") {
    return {
      canApprove: false,
      label: "Approval held",
      reason: "Approve becomes available after the answer is ready for review."
    };
  }

  return {
    canApprove: true,
    label: "Approve",
    reason: null
  };
}
