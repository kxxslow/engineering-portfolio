import { withSupportDb } from "@/db/client";
import {
  getAuditEvents as getAuditEventsFromDb,
  getDraftCase,
  getDraftCaseByTicketId,
  getDraftCases,
  getKnowledgeLibrary as getKnowledgeLibraryFromDb,
  getReviewedCases as getReviewedCasesFromDb,
  loadKnowledge
} from "@/lib/support-service";
import {
  sourceChunks as seededSourceChunks,
  supportTickets as seededSupportTickets
} from "./seed-data";
import {
  applyReviewDecision,
  type DraftGenerationResult,
  type KnowledgeArticle,
  type SourceChunk
} from "./rag";

export function getGeneratedCases(): DraftGenerationResult[] {
  return withSupportDb((db) => getDraftCases(db));
}

export function getGeneratedCase(ticketId: string): DraftGenerationResult | undefined {
  return withSupportDb((db) => getDraftCaseByTicketId(db, ticketId));
}

export function getGeneratedCaseByDraftId(draftId: string): DraftGenerationResult | undefined {
  return withSupportDb((db) => getDraftCase(db, draftId));
}

export function getReviewedCases() {
  return withSupportDb((db) => getReviewedCasesFromDb(db));
}

export function getDashboardStats() {
  const cases = getGeneratedCases();
  const library = getKnowledgeLibrary();

  return {
    tickets: cases.length,
    knowledgeArticles: library.length,
    readyDrafts: cases.filter((item) => item.draft.status === "ready_for_review").length,
    needsReview: cases.filter((item) =>
      ["needs_review", "needs_edits", "blocked"].includes(item.draft.status)
    ).length,
    escalations: cases.filter((item) => item.draft.escalationStatus !== "none").length,
    citations: cases.reduce((count, item) => count + item.draft.citations.length, 0)
  };
}

export function getProofStatus() {
  const grounded = getGeneratedCase("ticket-return-iris");
  const unsupported = getGeneratedCase("ticket-discount-omar");
  const missing = getGeneratedCase("ticket-account-nora");
  const reviewed = getReviewedCases();
  const approvedGrounded = reviewed.find((item) => item.ticket.id === "ticket-return-iris");
  const riskyApproval = unsupported
    ? applyReviewDecision(unsupported.draft, {
        id: "review-unsafe-approval",
        draftId: unsupported.draft.id,
        decision: "approve",
        reviewerName: "Safety review",
        notes: "Should not approve unsupported claim.",
        decidedAt: "2026-08-10T11:00:00-07:00"
      })
    : undefined;
  const blockedApproval = missing
    ? applyReviewDecision(missing.draft, {
        id: "review-blocked-approval",
        draftId: missing.draft.id,
        decision: "approve",
        reviewerName: "Safety review",
        notes: "Should not approve blocked draft.",
        decidedAt: "2026-08-10T11:02:00-07:00"
      })
    : undefined;

  return {
    groundedAnswerAllowed:
      grounded?.groundingCheck.result === "passed" &&
      grounded.draft.confidence === "high" &&
      approvedGrounded?.reviewedDraft.status === "approved",
    citationsAttached:
      (grounded?.draft.citations.length ?? 0) >= 3 &&
      grounded?.draft.citations.every((citation) => citation.quote.length > 0) === true,
    missingSourcesBlocked:
      missing?.groundingCheck.result === "blocked" &&
      missing.draft.escalationStatus !== "none" &&
      missing.draft.citations.length === 0,
    unsupportedClaimsFlagged:
      unsupported?.groundingCheck.result === "needs_review" &&
      unsupported.draft.unsupportedClaims.some((claim) => claim.riskLevel === "high"),
    reviewDecisionsSafe:
      approvedGrounded?.reviewedDraft.status === "approved" &&
      riskyApproval?.status === "needs_edits" &&
      blockedApproval?.status === "needs_edits" &&
      reviewed.find((item) => item.ticket.id === "ticket-account-nora")?.reviewedDraft.status ===
        "escalated"
  };
}

export function getKnowledgeLibrary(): Array<KnowledgeArticle & { chunks: SourceChunk[] }> {
  return withSupportDb((db) => getKnowledgeLibraryFromDb(db));
}

export function getReviewQueue() {
  return getReviewedCases().filter((item) => item.reviewedDraft.status !== "approved");
}

export function getSourceChunk(chunkId: string): SourceChunk | undefined {
  return withSupportDb((db) => loadKnowledge(db).chunks.find((chunk) => chunk.id === chunkId));
}

export function getAuditEvents() {
  return withSupportDb((db) => getAuditEventsFromDb(db));
}

export const sourceChunks = seededSourceChunks;
export const supportTickets = seededSupportTickets;
