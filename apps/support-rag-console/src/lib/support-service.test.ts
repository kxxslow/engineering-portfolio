import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { openSupportDb } from "@/db/client";
import {
  auditEvents,
  citations,
  evaluationResults,
  reviewDecisions
} from "@/db/schema";
import { resetSupportDatabase } from "@/db/reset";
import {
  evaluateAnswerDraft,
  getDraftCase,
  persistReviewDecision
} from "@/lib/support-service";
import { POST as evaluateRoute } from "../../app/api/evaluations/[draftId]/route";

let tempDir = "";
let dbPath = "";

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "support-rag-test-"));
  dbPath = path.join(tempDir, "support.sqlite");
  process.env.SUPPORT_RAG_DB_PATH = dbPath;
  resetSupportDatabase(dbPath, false);
});

afterEach(() => {
  delete process.env.SUPPORT_RAG_DB_PATH;
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe("support RAG persistence", () => {
  it("approves a grounded answer and persists the review decision", () => {
    const connection = openSupportDb(dbPath);
    try {
      const reviewed = persistReviewDecision(connection.db, {
        draftId: "draft-ticket-return-iris",
        decision: "approve",
        notes: "Citations cover all claims.",
        decisionId: "review-test-approve",
        decidedAt: "2026-08-10T11:05:00-07:00"
      });
      const persisted = connection.db
        .select()
        .from(reviewDecisions)
        .where(eq(reviewDecisions.id, "review-test-approve"))
        .get();

      expect(reviewed.reviewedDraft.status).toBe("approved");
      expect(reviewed.reviewedDraft.reviewDecisionId).toBe("review-test-approve");
      expect(persisted?.decision).toBe("approve");
    } finally {
      connection.sqlite.close();
    }
  });

  it("blocks or escalates missing-source drafts", () => {
    const connection = openSupportDb(dbPath);
    try {
      const result = getDraftCase(connection.db, "draft-ticket-account-nora");

      expect(result?.draft.status).toBe("blocked");
      expect(result?.draft.escalationStatus).toBe("required");
      expect(result?.groundingCheck.result).toBe("blocked");
      expect(result?.draft.citations).toHaveLength(0);
    } finally {
      connection.sqlite.close();
    }
  });

  it("calculates citation coverage for grounded answers", () => {
    const connection = openSupportDb(dbPath);
    try {
      const result = getDraftCase(connection.db, "draft-ticket-return-iris");

      expect(result?.groundingCheck.supportedClaimCount).toBe(3);
      expect(result?.groundingCheck.totalClaimCount).toBe(3);
      expect(result?.groundingCheck.qualityScore).toBe(100);
    } finally {
      connection.sqlite.close();
    }
  });

  it("persists citations attached to the answer draft", () => {
    const connection = openSupportDb(dbPath);
    try {
      const attached = connection.db
        .select()
        .from(citations)
        .where(eq(citations.draftId, "draft-ticket-return-iris"))
        .all();

      expect(attached.length).toBeGreaterThanOrEqual(3);
      expect(attached.map((citation) => citation.factId)).toEqual(
        expect.arrayContaining([
          "fact-return-window-30",
          "fact-return-receipt-required",
          "fact-refund-original-method"
        ])
      );
    } finally {
      connection.sqlite.close();
    }
  });

  it("flags unsupported claims instead of producing a confident answer", () => {
    const connection = openSupportDb(dbPath);
    try {
      const result = getDraftCase(connection.db, "draft-ticket-discount-omar");

      expect(result?.draft.status).toBe("needs_review");
      expect(result?.draft.confidence).toBe("medium");
      expect(result?.draft.unsupportedClaims).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "unsupported-claim-holiday-stack",
            riskLevel: "high"
          })
        ])
      );
    } finally {
      connection.sqlite.close();
    }
  });

  it("prevents unsafe approval and records an audit event", () => {
    const connection = openSupportDb(dbPath);
    try {
      const reviewed = persistReviewDecision(connection.db, {
        draftId: "draft-ticket-discount-omar",
        decision: "approve",
        notes: "This attempted approval should be blocked.",
        decisionId: "review-test-unsafe-approve",
        decidedAt: "2026-08-10T11:08:00-07:00"
      });
      const audit = connection.db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.event, "unsafe_approval_prevented"))
        .all();

      expect(reviewed.reviewedDraft.status).toBe("needs_edits");
      expect(reviewed.reviewedDraft.reviewerNotes).toContain("Approval blocked");
      expect(audit).toHaveLength(1);
    } finally {
      connection.sqlite.close();
    }
  });

  it("persists request edit decisions", () => {
    const connection = openSupportDb(dbPath);
    try {
      persistReviewDecision(connection.db, {
        draftId: "draft-ticket-discount-omar",
        decision: "request_edits",
        notes: "Remove unsupported stacking claim.",
        decisionId: "review-test-request-edits",
        decidedAt: "2026-08-10T11:10:00-07:00"
      });
      const persisted = connection.db
        .select()
        .from(reviewDecisions)
        .where(eq(reviewDecisions.id, "review-test-request-edits"))
        .get();

      expect(persisted?.decision).toBe("request_edits");
      expect(persisted?.notes).toContain("unsupported stacking");
    } finally {
      connection.sqlite.close();
    }
  });

  it("persists review decision history", () => {
    const connection = openSupportDb(dbPath);
    try {
      persistReviewDecision(connection.db, {
        draftId: "draft-ticket-return-iris",
        decision: "approve",
        notes: "First reviewer approves grounded draft.",
        decisionId: "review-test-history-approve",
        decidedAt: "2026-08-10T11:12:00-07:00"
      });
      persistReviewDecision(connection.db, {
        draftId: "draft-ticket-return-iris",
        decision: "request_edits",
        notes: "Second reviewer asks to include the order number.",
        decisionId: "review-test-history-edit",
        decidedAt: "2026-08-10T11:13:00-07:00"
      });
      const history = connection.db
        .select()
        .from(reviewDecisions)
        .where(eq(reviewDecisions.draftId, "draft-ticket-return-iris"))
        .all();

      expect(history.map((decision) => decision.id)).toEqual([
        "review-test-history-approve",
        "review-test-history-edit"
      ]);
    } finally {
      connection.sqlite.close();
    }
  });

  it("allows the route handler to reach the core evaluation service", async () => {
    const response = await evaluateRoute(
      new Request("http://localhost/api/evaluations/draft-ticket-return-iris", {
        method: "POST"
      }),
      { params: Promise.resolve({ draftId: "draft-ticket-return-iris" }) }
    );
    const body = (await response.json()) as {
      result: string;
      citationCount: number;
    };

    const connection = openSupportDb(dbPath);
    try {
      const evaluations = connection.db
        .select()
        .from(evaluationResults)
        .where(eq(evaluationResults.draftId, "draft-ticket-return-iris"))
        .all();

      expect(response.status).toBe(200);
      expect(body.result).toBe("passed");
      expect(body.citationCount).toBeGreaterThanOrEqual(3);
      expect(evaluations.length).toBeGreaterThanOrEqual(2);
    } finally {
      connection.sqlite.close();
    }
  });

  it("can re-run draft evaluation through the service", () => {
    const connection = openSupportDb(dbPath);
    try {
      const result = evaluateAnswerDraft(connection.db, "draft-ticket-return-iris", {
        evaluationId: "evaluation-test-rerun",
        evaluatedAt: "2026-08-10T11:20:00-07:00"
      });

      expect(result.groundingCheck.result).toBe("passed");
      expect(result.draft.citations.length).toBeGreaterThanOrEqual(3);
    } finally {
      connection.sqlite.close();
    }
  });
});
