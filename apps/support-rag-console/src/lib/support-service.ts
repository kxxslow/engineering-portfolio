import { eq } from "drizzle-orm";

import type { SupportDb } from "@/db/client";
import {
  answerDrafts,
  auditEvents,
  citations,
  evaluationResults,
  reviewDecisions,
  sourceChunks,
  sourceFacts,
  sources,
  tickets,
  type AnswerDraftRow,
  type AuditEventRow,
  type CitationRow,
  type EvaluationResultRow,
  type ReviewDecisionRow,
  type SourceChunkRow,
  type SourceFactRow,
  type SourceRow,
  type TicketRow
} from "@/db/schema";
import {
  applyReviewDecision as applyReviewDecisionToDraft,
  generateAnswerDraft,
  type AnswerDraft,
  type Citation,
  type DraftGenerationResult,
  type GroundingCheck,
  type KnowledgeArticle,
  type RetrievedSource,
  type ReviewAction,
  type ReviewDecision,
  type RiskLevel,
  type SourceChunk,
  type SupportTicket,
  type UnsupportedClaim
} from "@/lib/rag";

export interface ReviewedCase extends DraftGenerationResult {
  decision?: ReviewDecision;
  reviewedDraft: AnswerDraft;
  evaluationHistory: GroundingCheck[];
  auditTrail: AuditEventRow[];
}

export function evaluateAnswerDraft(
  db: SupportDb,
  draftId: string,
  options: {
    evaluationId?: string;
    evaluatedAt?: string;
  } = {}
) {
  const draftRow = db.select().from(answerDrafts).where(eq(answerDrafts.id, draftId)).get();
  if (!draftRow) {
    throw new Error(`Draft ${draftId} was not found.`);
  }

  const ticketRow = db.select().from(tickets).where(eq(tickets.id, draftRow.ticketId)).get();
  if (!ticketRow) {
    throw new Error(`Ticket ${draftRow.ticketId} was not found.`);
  }

  const evaluatedAt = options.evaluatedAt ?? new Date().toISOString();
  const knowledge = loadKnowledge(db);
  const result = generateAnswerDraft(
    rowToTicket(ticketRow),
    knowledge.articles,
    knowledge.chunks,
    draftRow.createdAt
  );
  const evaluationId =
    options.evaluationId ?? `evaluation-${draftId}-${safeTimestamp(evaluatedAt)}`;

  db.delete(citations).where(eq(citations.draftId, draftId)).run();
  if (result.draft.citations.length > 0) {
    db.insert(citations)
      .values(
        result.draft.citations.map((citation) => ({
          id: `${draftId}-${citation.id}`,
          draftId,
          sourceId: citation.articleId,
          chunkId: citation.chunkId,
          factId: citation.factId,
          label: citation.label,
          quote: citation.quote
        }))
      )
      .run();
  }

  db.insert(evaluationResults)
    .values({
      id: evaluationId,
      draftId,
      result: result.groundingCheck.result,
      relevantSourceCount: result.groundingCheck.relevantSourceCount,
      supportedClaimCount: result.groundingCheck.supportedClaimCount,
      totalClaimCount: result.groundingCheck.totalClaimCount,
      unsupportedClaimsJson: JSON.stringify(result.draft.unsupportedClaims),
      retrievedSourcesJson: JSON.stringify(result.retrievedSources),
      riskLevel: result.groundingCheck.riskLevel,
      qualityScore: result.groundingCheck.qualityScore,
      rationale: result.groundingCheck.rationale,
      evaluatedAt
    })
    .run();

  db.update(answerDrafts)
    .set({
      answerText: result.draft.answerText,
      status: result.draft.status,
      confidence: result.draft.confidence,
      riskLevel: result.draft.riskLevel,
      escalationStatus: result.draft.escalationStatus,
      reviewerNotes: null,
      reviewDecisionId: null
    })
    .where(eq(answerDrafts.id, draftId))
    .run();

  db.update(tickets)
    .set({
      status: ticketStatusForDraft(result.draft.status),
      updatedAt: evaluatedAt
    })
    .where(eq(tickets.id, ticketRow.id))
    .run();

  logAudit(db, {
    ticketId: ticketRow.id,
    draftId,
    level: result.groundingCheck.result === "passed" ? "info" : "warn",
    event: "answer_evaluated",
    message:
      result.groundingCheck.result === "passed"
        ? "Draft evaluation persisted with full citation coverage."
        : "Draft evaluation persisted with unsupported claims or missing evidence.",
    createdAt: evaluatedAt
  });

  const updated = getDraftCase(db, draftId);
  if (!updated) {
    throw new Error(`Draft ${draftId} could not be reloaded after evaluation.`);
  }

  return updated;
}

export function persistReviewDecision(
  db: SupportDb,
  options: {
    draftId: string;
    decision: ReviewAction;
    notes: string;
    reviewerName?: string;
    decisionId?: string;
    decidedAt?: string;
  }
) {
  const current = getDraftCase(db, options.draftId) ?? evaluateAnswerDraft(db, options.draftId);
  const decidedAt = options.decidedAt ?? new Date().toISOString();
  const decision: ReviewDecision = {
    id:
      options.decisionId ??
      `review-${options.draftId}-${options.decision}-${safeTimestamp(decidedAt)}`,
    draftId: options.draftId,
    decision: options.decision,
    reviewerName: options.reviewerName ?? "Maya, Support Lead",
    notes: options.notes,
    decidedAt
  };
  const reviewedDraft = applyReviewDecisionToDraft(current.draft, decision);

  db.insert(reviewDecisions).values(decision).run();
  db.update(answerDrafts)
    .set({
      status: reviewedDraft.status,
      riskLevel: reviewedDraft.riskLevel,
      escalationStatus: reviewedDraft.escalationStatus,
      reviewerNotes: reviewedDraft.reviewerNotes ?? null,
      reviewDecisionId: decision.id
    })
    .where(eq(answerDrafts.id, options.draftId))
    .run();
  db.update(tickets)
    .set({
      status: ticketStatusForDraft(reviewedDraft.status),
      updatedAt: decidedAt
    })
    .where(eq(tickets.id, current.ticket.id))
    .run();

  logAudit(db, {
    ticketId: current.ticket.id,
    draftId: options.draftId,
    level: reviewedDraft.status === "approved" ? "info" : "warn",
    event:
      decision.decision === "approve" && reviewedDraft.status !== "approved"
        ? "unsafe_approval_prevented"
        : "review_decision_persisted",
    message:
      decision.decision === "approve" && reviewedDraft.status !== "approved"
        ? "Approval was blocked because the draft still has unsupported or escalated claims."
        : `${decision.decision.replaceAll("_", " ")} decision persisted for reviewer history.`,
    createdAt: decidedAt
  });

  const updated = getReviewedCase(db, options.draftId);
  if (!updated) {
    throw new Error(`Draft ${options.draftId} could not be reloaded after review.`);
  }

  return updated;
}

export function getDraftCase(db: SupportDb, draftId: string): DraftGenerationResult | undefined {
  const draftRow = db.select().from(answerDrafts).where(eq(answerDrafts.id, draftId)).get();
  if (!draftRow) {
    return undefined;
  }

  return buildCaseFromDraftRow(db, draftRow);
}

export function getDraftCaseByTicketId(
  db: SupportDb,
  ticketId: string
): DraftGenerationResult | undefined {
  const draftRow = db
    .select()
    .from(answerDrafts)
    .where(eq(answerDrafts.ticketId, ticketId))
    .get();

  return draftRow ? buildCaseFromDraftRow(db, draftRow) : undefined;
}

export function getDraftCases(db: SupportDb): DraftGenerationResult[] {
  return db
    .select()
    .from(answerDrafts)
    .all()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((draftRow) => buildCaseFromDraftRow(db, draftRow))
    .filter((item): item is DraftGenerationResult => Boolean(item));
}

export function getReviewedCase(db: SupportDb, draftId: string): ReviewedCase | undefined {
  const base = getDraftCase(db, draftId);
  if (!base) {
    return undefined;
  }

  const latestDecision = getLatestDecision(db, draftId);
  const evaluationHistory = getEvaluationHistory(db, draftId);
  const auditTrail = db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.draftId, draftId))
    .all()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    ...base,
    decision: latestDecision ? rowToReviewDecision(latestDecision) : undefined,
    reviewedDraft: base.draft,
    evaluationHistory,
    auditTrail
  };
}

export function getReviewedCases(db: SupportDb): ReviewedCase[] {
  return getDraftCases(db)
    .map((item) => getReviewedCase(db, item.draft.id))
    .filter((item): item is ReviewedCase => Boolean(item));
}

export function getKnowledgeLibrary(db: SupportDb) {
  const knowledge = loadKnowledge(db);

  return knowledge.articles.map((article) => ({
    ...article,
    chunks: knowledge.chunks.filter((chunk) => chunk.articleId === article.id)
  }));
}

export function getAuditEvents(db: SupportDb) {
  return db
    .select()
    .from(auditEvents)
    .all()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function loadKnowledge(db: SupportDb): {
  articles: KnowledgeArticle[];
  chunks: SourceChunk[];
} {
  const articleRows = db.select().from(sources).all();
  const chunkRows = db.select().from(sourceChunks).all();
  const factRows = db.select().from(sourceFacts).all();

  return {
    articles: articleRows.map(rowToArticle),
    chunks: chunkRows.map((chunk) => rowToChunk(chunk, factRows))
  };
}

function buildCaseFromDraftRow(
  db: SupportDb,
  draftRow: AnswerDraftRow
): DraftGenerationResult | undefined {
  const ticketRow = db.select().from(tickets).where(eq(tickets.id, draftRow.ticketId)).get();
  const latestEvaluation = getLatestEvaluation(db, draftRow.id);
  if (!ticketRow || !latestEvaluation) {
    return undefined;
  }

  const citationRows = db
    .select()
    .from(citations)
    .where(eq(citations.draftId, draftRow.id))
    .all();
  const unsupportedClaims = parseJson<UnsupportedClaim[]>(
    latestEvaluation.unsupportedClaimsJson,
    []
  );

  return {
    ticket: rowToTicket(ticketRow),
    draft: rowToDraft(draftRow, citationRows, unsupportedClaims),
    groundingCheck: rowToGroundingCheck(latestEvaluation),
    retrievedSources: parseJson<RetrievedSource[]>(
      latestEvaluation.retrievedSourcesJson,
      []
    )
  };
}

function getLatestEvaluation(db: SupportDb, draftId: string) {
  return db
    .select()
    .from(evaluationResults)
    .where(eq(evaluationResults.draftId, draftId))
    .all()
    .sort((left, right) => right.evaluatedAt.localeCompare(left.evaluatedAt))[0];
}

function getEvaluationHistory(db: SupportDb, draftId: string): GroundingCheck[] {
  return db
    .select()
    .from(evaluationResults)
    .where(eq(evaluationResults.draftId, draftId))
    .all()
    .sort((left, right) => right.evaluatedAt.localeCompare(left.evaluatedAt))
    .map(rowToGroundingCheck);
}

function getLatestDecision(db: SupportDb, draftId: string) {
  return db
    .select()
    .from(reviewDecisions)
    .where(eq(reviewDecisions.draftId, draftId))
    .all()
    .sort((left, right) => right.decidedAt.localeCompare(left.decidedAt))[0];
}

function rowToTicket(row: TicketRow): SupportTicket {
  return {
    id: row.id,
    customerName: row.customerName,
    subject: row.subject,
    question: row.question,
    channel: row.channel as SupportTicket["channel"],
    priority: row.priority as SupportTicket["priority"],
    status: row.status as SupportTicket["status"],
    intent: row.intent as SupportTicket["intent"],
    createdAt: row.createdAt
  };
}

function rowToArticle(row: SourceRow): KnowledgeArticle {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    owner: row.owner,
    updatedAt: row.updatedAt,
    status: row.status as KnowledgeArticle["status"]
  };
}

function rowToChunk(row: SourceChunkRow, facts: SourceFactRow[]): SourceChunk {
  return {
    id: row.id,
    articleId: row.sourceId,
    heading: row.heading,
    content: row.content,
    keywords: parseJson<string[]>(row.keywordsJson, []),
    facts: facts
      .filter((fact) => fact.chunkId === row.id)
      .map((fact) => ({
        id: fact.id,
        statement: fact.statement
      }))
  };
}

function rowToDraft(
  row: AnswerDraftRow,
  citationRows: CitationRow[],
  unsupportedClaims: UnsupportedClaim[]
): AnswerDraft {
  return {
    id: row.id,
    ticketId: row.ticketId,
    answerText: row.answerText,
    status: row.status as AnswerDraft["status"],
    confidence: row.confidence as AnswerDraft["confidence"],
    riskLevel: row.riskLevel as RiskLevel,
    escalationStatus: row.escalationStatus as AnswerDraft["escalationStatus"],
    citations: citationRows.map(rowToCitation),
    unsupportedClaims,
    createdAt: row.createdAt,
    reviewerNotes: row.reviewerNotes ?? undefined,
    reviewDecisionId: row.reviewDecisionId ?? undefined
  };
}

function rowToCitation(row: CitationRow): Citation {
  return {
    id: row.id,
    articleId: row.sourceId,
    chunkId: row.chunkId,
    factId: row.factId,
    label: row.label,
    quote: row.quote
  };
}

function rowToGroundingCheck(row: EvaluationResultRow): GroundingCheck {
  return {
    id: row.id,
    draftId: row.draftId,
    result: row.result as GroundingCheck["result"],
    relevantSourceCount: row.relevantSourceCount,
    supportedClaimCount: row.supportedClaimCount,
    totalClaimCount: row.totalClaimCount,
    unsupportedClaims: parseJson<UnsupportedClaim[]>(
      row.unsupportedClaimsJson,
      []
    ),
    riskLevel: row.riskLevel as RiskLevel,
    qualityScore: row.qualityScore,
    rationale: row.rationale
  };
}

function rowToReviewDecision(row: ReviewDecisionRow): ReviewDecision {
  return {
    id: row.id,
    draftId: row.draftId,
    decision: row.decision as ReviewAction,
    reviewerName: row.reviewerName,
    notes: row.notes,
    decidedAt: row.decidedAt
  };
}

function ticketStatusForDraft(status: AnswerDraft["status"]): SupportTicket["status"] {
  if (status === "approved") {
    return "closed";
  }

  if (status === "blocked" || status === "escalated") {
    return "escalated";
  }

  if (status === "ready_for_review") {
    return "drafted";
  }

  return "needs_review";
}

function logAudit(
  db: SupportDb,
  event: {
    ticketId: string;
    draftId: string;
    level: "info" | "warn";
    event: string;
    message: string;
    createdAt: string;
  }
) {
  const existing = db.select().from(auditEvents).all().length;

  db.insert(auditEvents)
    .values({
      id: `audit-${String(existing + 1).padStart(3, "0")}-${event.event}-${safeTimestamp(event.createdAt)}`,
      ticketId: event.ticketId,
      draftId: event.draftId,
      level: event.level,
      event: event.event,
      message: event.message,
      createdAt: event.createdAt
    })
    .run();
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeTimestamp(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}
