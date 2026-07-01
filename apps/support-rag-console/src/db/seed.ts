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
} from "@/db/schema";
import {
  knowledgeArticles,
  reviewDecisions as demoReviewDecisions,
  sourceChunks as seedChunks,
  supportTickets,
} from "@/lib/seed-data";
import {
  evaluateAnswerDraft,
  persistReviewDecision,
} from "@/lib/support-service";

const seededAt = "2026-08-10T10:30:00-07:00";

export function seedSupportData(db: SupportDb, includeDemoDecisions = true) {
  db.delete(auditEvents).run();
  db.delete(reviewDecisions).run();
  db.delete(evaluationResults).run();
  db.delete(citations).run();
  db.delete(answerDrafts).run();
  db.delete(sourceFacts).run();
  db.delete(sourceChunks).run();
  db.delete(sources).run();
  db.delete(tickets).run();

  db.insert(sources)
    .values(
      knowledgeArticles.map((article) => ({
        id: article.id,
        title: article.title,
        category: article.category,
        owner: article.owner,
        updatedAt: article.updatedAt,
        status: article.status,
      })),
    )
    .run();

  db.insert(sourceChunks)
    .values(
      seedChunks.map((chunk) => ({
        id: chunk.id,
        sourceId: chunk.articleId,
        heading: chunk.heading,
        content: chunk.content,
        keywordsJson: JSON.stringify(chunk.keywords),
      })),
    )
    .run();

  db.insert(sourceFacts)
    .values(
      seedChunks.flatMap((chunk) =>
        chunk.facts.map((fact) => ({
          id: fact.id,
          chunkId: chunk.id,
          statement: fact.statement,
        })),
      ),
    )
    .run();

  db.insert(tickets)
    .values(
      supportTickets.map((ticket) => ({
        id: ticket.id,
        customerName: ticket.customerName,
        subject: ticket.subject,
        question: ticket.question,
        channel: ticket.channel,
        priority: ticket.priority,
        status: ticket.status,
        intent: ticket.intent,
        createdAt: ticket.createdAt,
        updatedAt: ticket.createdAt,
      })),
    )
    .run();

  db.insert(answerDrafts)
    .values(
      supportTickets.map((ticket) => ({
        id: `draft-${ticket.id}`,
        ticketId: ticket.id,
        answerText: "Awaiting source evaluation.",
        status: "needs_review",
        confidence: "low",
        riskLevel: "medium",
        escalationStatus: "none",
        createdAt: seededAt,
        reviewerNotes: null,
        reviewDecisionId: null,
      })),
    )
    .run();

  for (const ticket of supportTickets) {
    evaluateAnswerDraft(db, `draft-${ticket.id}`, {
      evaluationId: `evaluation-draft-${ticket.id}-seed`,
      evaluatedAt: seededAt,
    });
  }

  if (includeDemoDecisions) {
    for (const decision of demoReviewDecisions) {
      persistReviewDecision(db, {
        draftId: decision.draftId,
        decision: decision.decision,
        reviewerName: decision.reviewerName,
        notes: decision.notes,
        decisionId: decision.id,
        decidedAt: decision.decidedAt,
      });
    }
  }
}
