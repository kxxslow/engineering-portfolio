export type ID = string;

export type RiskLevel = "low" | "medium" | "high";
export type EscalationStatus = "none" | "required" | "escalated";
export type TicketStatus = "open" | "drafted" | "needs_review" | "escalated" | "closed";
export type TicketPriority = "normal" | "high";
export type SupportIntent =
  | "return_policy"
  | "discount_stack"
  | "account_data_export"
  | "shipping_delay"
  | "damaged_item_replacement"
  | "warranty_eligibility"
  | "gift_card_balance"
  | "invoice_receipt"
  | "address_change";
export type AnswerStatus =
  | "ready_for_review"
  | "needs_review"
  | "blocked"
  | "approved"
  | "rejected"
  | "needs_edits"
  | "escalated";
export type GroundingResult = "passed" | "needs_review" | "blocked";
export type ReviewAction = "approve" | "reject" | "request_edits" | "escalate";

export interface SupportTicket {
  id: ID;
  customerName: string;
  subject: string;
  question: string;
  channel: "chat" | "email";
  priority: TicketPriority;
  status: TicketStatus;
  intent: SupportIntent;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: ID;
  title: string;
  category: string;
  owner: string;
  updatedAt: string;
  status: "published" | "draft";
}

export interface KnowledgeFact {
  id: ID;
  statement: string;
}

export interface SourceChunk {
  id: ID;
  articleId: ID;
  heading: string;
  content: string;
  keywords: string[];
  facts: KnowledgeFact[];
}

export interface RetrievedSource {
  chunkId: ID;
  articleId: ID;
  score: number;
  matchedTerms: string[];
  excerpt: string;
}

export interface Citation {
  id: ID;
  articleId: ID;
  chunkId: ID;
  factId: ID;
  label: string;
  quote: string;
}

export interface UnsupportedClaim {
  id: ID;
  text: string;
  missingFactIds: ID[];
  riskLevel: RiskLevel;
}

export interface AnswerDraft {
  id: ID;
  ticketId: ID;
  answerText: string;
  status: AnswerStatus;
  confidence: "high" | "medium" | "low";
  riskLevel: RiskLevel;
  escalationStatus: EscalationStatus;
  citations: Citation[];
  unsupportedClaims: UnsupportedClaim[];
  createdAt: string;
  reviewerNotes?: string;
  reviewDecisionId?: ID;
}

export interface GroundingCheck {
  id: ID;
  draftId: ID;
  result: GroundingResult;
  relevantSourceCount: number;
  supportedClaimCount: number;
  totalClaimCount: number;
  unsupportedClaims: UnsupportedClaim[];
  riskLevel: RiskLevel;
  qualityScore: number;
  rationale: string;
}

export interface ReviewDecision {
  id: ID;
  draftId: ID;
  decision: ReviewAction;
  reviewerName: string;
  notes: string;
  decidedAt: string;
}

export interface DraftGenerationResult {
  ticket: SupportTicket;
  draft: AnswerDraft;
  groundingCheck: GroundingCheck;
  retrievedSources: RetrievedSource[];
}

interface AnswerClaim {
  id: ID;
  text: string;
  requiredFactIds: ID[];
  riskLevel: RiskLevel;
}

interface AnswerPlan {
  fallback: string;
  claims: AnswerClaim[];
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "for",
  "from",
  "have",
  "how",
  "i",
  "if",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "their",
  "this",
  "to",
  "we",
  "what",
  "when",
  "with"
]);

const ANSWER_PLANS: Record<SupportIntent, AnswerPlan> = {
  return_policy: {
    fallback: "I can answer only the return details supported by the knowledge base.",
    claims: [
      {
        id: "claim-return-window",
        text: "The order is inside the 30-day return window for unused items.",
        requiredFactIds: ["fact-return-window-30"],
        riskLevel: "low"
      },
      {
        id: "claim-receipt-needed",
        text: "The support team should ask for the order number or receipt before approving the return.",
        requiredFactIds: ["fact-return-receipt-required"],
        riskLevel: "low"
      },
      {
        id: "claim-refund-method",
        text: "Approved refunds go back to the original payment method after inspection.",
        requiredFactIds: ["fact-refund-original-method"],
        riskLevel: "medium"
      }
    ]
  },
  discount_stack: {
    fallback: "I can answer the documented discount rules, but stacking claims need review.",
    claims: [
      {
        id: "claim-single-code",
        text: "Only one promo code can be applied to an order.",
        requiredFactIds: ["fact-discount-one-code"],
        riskLevel: "low"
      },
      {
        id: "claim-manual-credit",
        text: "Support may request a manual goodwill credit when a documented promo fails.",
        requiredFactIds: ["fact-discount-goodwill-credit"],
        riskLevel: "medium"
      },
      {
        id: "claim-holiday-stack",
        text: "The welcome code can be stacked with a holiday sale.",
        requiredFactIds: ["fact-discount-holiday-stack"],
        riskLevel: "high"
      }
    ]
  },
  account_data_export: {
    fallback:
      "I do not have enough source evidence to answer this account access request. Escalate to a human reviewer.",
    claims: [
      {
        id: "claim-password-reset",
        text: "Support can reset the customer password and export the account transcript over email.",
        requiredFactIds: ["fact-account-export-password-reset"],
        riskLevel: "high"
      }
    ]
  },
  shipping_delay: {
    fallback: "I can answer the shipping-delay steps supported by the fulfillment playbook.",
    claims: [
      {
        id: "claim-shipping-investigation",
        text: "A delivery delay over five business days qualifies for a tracking investigation.",
        requiredFactIds: ["fact-shipping-investigation"],
        riskLevel: "low"
      },
      {
        id: "claim-shipping-follow-up",
        text: "Support should schedule a shipping-status follow-up while the investigation is open.",
        requiredFactIds: ["fact-shipping-status-follow-up"],
        riskLevel: "low"
      }
    ]
  },
  damaged_item_replacement: {
    fallback: "I can answer the documented damaged-item replacement steps.",
    claims: [
      {
        id: "claim-damage-photo-required",
        text: "Support should request photos of the damaged packaging and item before replacing it.",
        requiredFactIds: ["fact-damaged-photo-required"],
        riskLevel: "low"
      },
      {
        id: "claim-damage-review-replacement",
        text: "A replacement can be offered after the damage review is approved.",
        requiredFactIds: ["fact-damaged-replacement-after-review"],
        riskLevel: "medium"
      },
      {
        id: "claim-damage-overnight-replacement",
        text: "Support can promise an overnight replacement before review.",
        requiredFactIds: ["fact-damaged-overnight-replacement"],
        riskLevel: "medium"
      }
    ]
  },
  warranty_eligibility: {
    fallback: "I can answer warranty eligibility using the warranty source.",
    claims: [
      {
        id: "claim-warranty-one-year",
        text: "Warranty coverage is available for manufacturing defects within one year.",
        requiredFactIds: ["fact-warranty-one-year"],
        riskLevel: "low"
      },
      {
        id: "claim-warranty-proof-purchase",
        text: "Support should collect proof of purchase before confirming warranty coverage.",
        requiredFactIds: ["fact-warranty-proof-purchase"],
        riskLevel: "low"
      }
    ]
  },
  gift_card_balance: {
    fallback: "I can answer supported gift-card balance steps, but payout claims need review.",
    claims: [
      {
        id: "claim-gift-card-balance-check",
        text: "Support can help the customer check the remaining gift card balance.",
        requiredFactIds: ["fact-gift-card-balance-check"],
        riskLevel: "low"
      },
      {
        id: "claim-gift-card-cashout",
        text: "Support can cash out any unused gift card balance on request.",
        requiredFactIds: ["fact-gift-card-cashout"],
        riskLevel: "medium"
      }
    ]
  },
  invoice_receipt: {
    fallback: "I can answer receipt and invoice steps from the billing source.",
    claims: [
      {
        id: "claim-invoice-self-serve",
        text: "Customers can download invoices from order history after the order is paid.",
        requiredFactIds: ["fact-invoice-self-serve"],
        riskLevel: "low"
      },
      {
        id: "claim-vat-business-details",
        text: "VAT receipt requests require the business name and tax registration details.",
        requiredFactIds: ["fact-vat-business-details"],
        riskLevel: "low"
      }
    ]
  },
  address_change: {
    fallback: "I can answer address changes before fulfillment, but carrier-handoff changes need review.",
    claims: [
      {
        id: "claim-address-before-fulfillment",
        text: "Address changes can be requested before the order leaves fulfillment.",
        requiredFactIds: ["fact-address-before-fulfillment"],
        riskLevel: "low"
      },
      {
        id: "claim-address-confirmation",
        text: "Support should confirm the updated address before changing the shipment.",
        requiredFactIds: ["fact-address-confirmation-required"],
        riskLevel: "low"
      },
      {
        id: "claim-address-after-carrier-handoff",
        text: "Support can reroute any package after carrier handoff.",
        requiredFactIds: ["fact-address-after-carrier-handoff"],
        riskLevel: "high"
      },
      {
        id: "claim-address-guaranteed-delivery",
        text: "Support can guarantee the new delivery date after a reroute request.",
        requiredFactIds: ["fact-address-guaranteed-delivery-date"],
        riskLevel: "medium"
      }
    ]
  }
};

export function retrieveSources(
  ticket: SupportTicket,
  chunks: SourceChunk[],
  limit = 3
): RetrievedSource[] {
  const queryTerms = tokenize(`${ticket.subject} ${ticket.question} ${ticket.intent.replaceAll("_", " ")}`);

  return chunks
    .map((chunk) => {
      const chunkTerms = new Set([
        ...chunk.keywords.map((keyword) => keyword.toLowerCase()),
        ...tokenize(chunk.heading)
      ]);
      const matchedTerms = [...queryTerms].filter((term) => chunkTerms.has(term));

      return {
        chunk,
        matchedTerms,
        score: matchedTerms.length
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.chunk.id.localeCompare(right.chunk.id))
    .slice(0, limit)
    .map((result) => ({
      chunkId: result.chunk.id,
      articleId: result.chunk.articleId,
      score: result.score,
      matchedTerms: result.matchedTerms,
      excerpt: result.chunk.content
    }));
}

export function generateAnswerDraft(
  ticket: SupportTicket,
  articles: KnowledgeArticle[],
  chunks: SourceChunk[],
  createdAt = "2026-08-10T10:30:00-07:00"
): DraftGenerationResult {
  const plan = ANSWER_PLANS[ticket.intent];
  const retrievedSources = retrieveSources(ticket, chunks);
  const factMatches = buildFactMatches(retrievedSources, chunks, articles);

  if (retrievedSources.length === 0) {
    return buildBlockedResult(ticket, plan, createdAt, "No relevant knowledge source met the retrieval threshold.");
  }

  const supportedClaims: AnswerClaim[] = [];
  const unsupportedClaims: UnsupportedClaim[] = [];
  const citations: Citation[] = [];

  for (const claim of plan.claims) {
    const missingFactIds = claim.requiredFactIds.filter((factId) => !factMatches.has(factId));
    const claimCitations = claim.requiredFactIds.flatMap((factId) => factMatches.get(factId) ?? []);

    if (missingFactIds.length === 0) {
      supportedClaims.push(claim);
      citations.push(...claimCitations);
    } else {
      unsupportedClaims.push({
        id: `unsupported-${claim.id}`,
        text: claim.text,
        missingFactIds,
        riskLevel: claim.riskLevel
      });
    }
  }

  if (supportedClaims.length === 0) {
    return buildBlockedResult(ticket, plan, createdAt, "Retrieved sources did not support any planned answer claim.");
  }

  const dedupedCitations = dedupeCitations(citations);
  const coverage = supportedClaims.length / plan.claims.length;
  const riskLevel = getRiskLevel(unsupportedClaims);
  const confidence = unsupportedClaims.length === 0 && coverage === 1 ? "high" : coverage >= 0.5 ? "medium" : "low";
  const result: GroundingResult = unsupportedClaims.length === 0 ? "passed" : "needs_review";
  const status: AnswerStatus = result === "passed" ? "ready_for_review" : "needs_review";
  const answerText = [
    plan.fallback,
    ...supportedClaims.map((claim) => claim.text),
    unsupportedClaims.length > 0
      ? "Do not send unsupported details until a reviewer resolves the flagged claims."
      : "This draft is ready for human review before sending."
  ].join(" ");
  const draft: AnswerDraft = {
    id: `draft-${ticket.id}`,
    ticketId: ticket.id,
    answerText,
    status,
    confidence,
    riskLevel,
    escalationStatus: riskLevel === "high" ? "required" : "none",
    citations: dedupedCitations,
    unsupportedClaims,
    createdAt
  };

  return {
    ticket,
    draft,
    groundingCheck: {
      id: `grounding-${draft.id}`,
      draftId: draft.id,
      result,
      relevantSourceCount: retrievedSources.length,
      supportedClaimCount: supportedClaims.length,
      totalClaimCount: plan.claims.length,
      unsupportedClaims,
      riskLevel,
      qualityScore: Math.round(coverage * 100),
      rationale:
        unsupportedClaims.length === 0
          ? "Every planned claim is supported by a retrieved source fact."
          : "One or more planned claims are missing source support and require review."
    },
    retrievedSources
  };
}

export function applyReviewDecision(draft: AnswerDraft, decision: ReviewDecision): AnswerDraft {
  if (decision.decision === "approve") {
    if (draft.status !== "ready_for_review" || draft.unsupportedClaims.length > 0 || draft.escalationStatus !== "none") {
      return {
        ...draft,
        status: "needs_edits",
        reviewerNotes: `Approval blocked: ${decision.notes}`,
        reviewDecisionId: decision.id
      };
    }

    return {
      ...draft,
      status: "approved",
      reviewerNotes: decision.notes,
      reviewDecisionId: decision.id
    };
  }

  if (decision.decision === "reject") {
    return {
      ...draft,
      status: "rejected",
      reviewerNotes: decision.notes,
      reviewDecisionId: decision.id
    };
  }

  if (decision.decision === "escalate") {
    return {
      ...draft,
      status: "escalated",
      riskLevel: "high",
      escalationStatus: "escalated",
      reviewerNotes: decision.notes,
      reviewDecisionId: decision.id
    };
  }

  return {
    ...draft,
    status: "needs_edits",
    reviewerNotes: decision.notes,
    reviewDecisionId: decision.id
  };
}

function buildBlockedResult(
  ticket: SupportTicket,
  plan: AnswerPlan,
  createdAt: string,
  rationale: string
): DraftGenerationResult {
  const unsupportedClaims = plan.claims.map((claim) => ({
    id: `unsupported-${claim.id}`,
    text: claim.text,
    missingFactIds: claim.requiredFactIds,
    riskLevel: claim.riskLevel
  }));
  const draft: AnswerDraft = {
    id: `draft-${ticket.id}`,
    ticketId: ticket.id,
    answerText: plan.fallback,
    status: "blocked",
    confidence: "low",
    riskLevel: "high",
    escalationStatus: "required",
    citations: [],
    unsupportedClaims,
    createdAt
  };

  return {
    ticket,
    draft,
    groundingCheck: {
      id: `grounding-${draft.id}`,
      draftId: draft.id,
      result: "blocked",
      relevantSourceCount: 0,
      supportedClaimCount: 0,
      totalClaimCount: plan.claims.length,
      unsupportedClaims,
      riskLevel: "high",
      qualityScore: 0,
      rationale
    },
    retrievedSources: []
  };
}

function buildFactMatches(
  retrievedSources: RetrievedSource[],
  chunks: SourceChunk[],
  articles: KnowledgeArticle[]
): Map<ID, Citation[]> {
  const retrievedChunkIds = new Set(retrievedSources.map((source) => source.chunkId));
  const articleById = new Map(articles.map((article) => [article.id, article]));
  const matches = new Map<ID, Citation[]>();

  for (const chunk of chunks) {
    if (!retrievedChunkIds.has(chunk.id)) {
      continue;
    }

    for (const fact of chunk.facts) {
      const article = articleById.get(chunk.articleId);
      const label = article ? `${article.title} / ${chunk.heading}` : chunk.heading;
      const citation: Citation = {
        id: `cite-${chunk.id}-${fact.id}`,
        articleId: chunk.articleId,
        chunkId: chunk.id,
        factId: fact.id,
        label,
        quote: fact.statement
      };
      matches.set(fact.id, [...(matches.get(fact.id) ?? []), citation]);
    }
  }

  return matches;
}

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<ID>();
  const deduped: Citation[] = [];

  for (const citation of citations) {
    if (seen.has(citation.id)) {
      continue;
    }
    seen.add(citation.id);
    deduped.push(citation);
  }

  return deduped;
}

function getRiskLevel(unsupportedClaims: UnsupportedClaim[]): RiskLevel {
  if (unsupportedClaims.some((claim) => claim.riskLevel === "high")) {
    return "high";
  }

  if (unsupportedClaims.length > 0) {
    return "medium";
  }

  return "low";
}

function tokenize(input: string): Set<string> {
  const terms = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .flatMap((term) => term.split("-"))
    .map((term) => term.trim())
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));

  return new Set(terms);
}
