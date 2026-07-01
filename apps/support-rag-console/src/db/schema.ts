import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  subject: text("subject").notNull(),
  question: text("question").notNull(),
  channel: text("channel").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  intent: text("intent").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  owner: text("owner").notNull(),
  status: text("status").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const sourceChunks = sqliteTable("source_chunks", {
  id: text("id").primaryKey(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  heading: text("heading").notNull(),
  content: text("content").notNull(),
  keywordsJson: text("keywords_json").notNull()
});

export const sourceFacts = sqliteTable("source_facts", {
  id: text("id").primaryKey(),
  chunkId: text("chunk_id")
    .notNull()
    .references(() => sourceChunks.id, { onDelete: "cascade" }),
  statement: text("statement").notNull()
});

export const answerDrafts = sqliteTable("answer_drafts", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  answerText: text("answer_text").notNull(),
  status: text("status").notNull(),
  confidence: text("confidence").notNull(),
  riskLevel: text("risk_level").notNull(),
  escalationStatus: text("escalation_status").notNull(),
  createdAt: text("created_at").notNull(),
  reviewerNotes: text("reviewer_notes"),
  reviewDecisionId: text("review_decision_id")
});

export const citations = sqliteTable("citations", {
  id: text("id").primaryKey(),
  draftId: text("draft_id")
    .notNull()
    .references(() => answerDrafts.id, { onDelete: "cascade" }),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id),
  chunkId: text("chunk_id")
    .notNull()
    .references(() => sourceChunks.id),
  factId: text("fact_id")
    .notNull()
    .references(() => sourceFacts.id),
  label: text("label").notNull(),
  quote: text("quote").notNull()
});

export const evaluationResults = sqliteTable("evaluation_results", {
  id: text("id").primaryKey(),
  draftId: text("draft_id")
    .notNull()
    .references(() => answerDrafts.id, { onDelete: "cascade" }),
  result: text("result").notNull(),
  relevantSourceCount: integer("relevant_source_count").notNull(),
  supportedClaimCount: integer("supported_claim_count").notNull(),
  totalClaimCount: integer("total_claim_count").notNull(),
  unsupportedClaimsJson: text("unsupported_claims_json").notNull(),
  retrievedSourcesJson: text("retrieved_sources_json").notNull(),
  riskLevel: text("risk_level").notNull(),
  qualityScore: integer("quality_score").notNull(),
  rationale: text("rationale").notNull(),
  evaluatedAt: text("evaluated_at").notNull()
});

export const reviewDecisions = sqliteTable("review_decisions", {
  id: text("id").primaryKey(),
  draftId: text("draft_id")
    .notNull()
    .references(() => answerDrafts.id, { onDelete: "cascade" }),
  decision: text("decision").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  notes: text("notes").notNull(),
  decidedAt: text("decided_at").notNull()
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  draftId: text("draft_id").references(() => answerDrafts.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  event: text("event").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull()
});

export type TicketRow = typeof tickets.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
export type SourceChunkRow = typeof sourceChunks.$inferSelect;
export type SourceFactRow = typeof sourceFacts.$inferSelect;
export type AnswerDraftRow = typeof answerDrafts.$inferSelect;
export type CitationRow = typeof citations.$inferSelect;
export type EvaluationResultRow = typeof evaluationResults.$inferSelect;
export type ReviewDecisionRow = typeof reviewDecisions.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
