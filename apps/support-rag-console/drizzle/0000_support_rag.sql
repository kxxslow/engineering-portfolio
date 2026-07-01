CREATE TABLE `tickets` (
  `id` text PRIMARY KEY NOT NULL,
  `customer_name` text NOT NULL,
  `subject` text NOT NULL,
  `question` text NOT NULL,
  `channel` text NOT NULL,
  `priority` text NOT NULL,
  `status` text NOT NULL,
  `intent` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `sources` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `owner` text NOT NULL,
  `status` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `source_chunks` (
  `id` text PRIMARY KEY NOT NULL,
  `source_id` text NOT NULL,
  `heading` text NOT NULL,
  `content` text NOT NULL,
  `keywords_json` text NOT NULL,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `source_facts` (
  `id` text PRIMARY KEY NOT NULL,
  `chunk_id` text NOT NULL,
  `statement` text NOT NULL,
  FOREIGN KEY (`chunk_id`) REFERENCES `source_chunks`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `answer_drafts` (
  `id` text PRIMARY KEY NOT NULL,
  `ticket_id` text NOT NULL,
  `answer_text` text NOT NULL,
  `status` text NOT NULL,
  `confidence` text NOT NULL,
  `risk_level` text NOT NULL,
  `escalation_status` text NOT NULL,
  `created_at` text NOT NULL,
  `reviewer_notes` text,
  `review_decision_id` text,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `citations` (
  `id` text PRIMARY KEY NOT NULL,
  `draft_id` text NOT NULL,
  `source_id` text NOT NULL,
  `chunk_id` text NOT NULL,
  `fact_id` text NOT NULL,
  `label` text NOT NULL,
  `quote` text NOT NULL,
  FOREIGN KEY (`draft_id`) REFERENCES `answer_drafts`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`chunk_id`) REFERENCES `source_chunks`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`fact_id`) REFERENCES `source_facts`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `evaluation_results` (
  `id` text PRIMARY KEY NOT NULL,
  `draft_id` text NOT NULL,
  `result` text NOT NULL,
  `relevant_source_count` integer NOT NULL,
  `supported_claim_count` integer NOT NULL,
  `total_claim_count` integer NOT NULL,
  `unsupported_claims_json` text NOT NULL,
  `retrieved_sources_json` text NOT NULL,
  `risk_level` text NOT NULL,
  `quality_score` integer NOT NULL,
  `rationale` text NOT NULL,
  `evaluated_at` text NOT NULL,
  FOREIGN KEY (`draft_id`) REFERENCES `answer_drafts`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `review_decisions` (
  `id` text PRIMARY KEY NOT NULL,
  `draft_id` text NOT NULL,
  `decision` text NOT NULL,
  `reviewer_name` text NOT NULL,
  `notes` text NOT NULL,
  `decided_at` text NOT NULL,
  FOREIGN KEY (`draft_id`) REFERENCES `answer_drafts`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `audit_events` (
  `id` text PRIMARY KEY NOT NULL,
  `ticket_id` text,
  `draft_id` text,
  `level` text NOT NULL,
  `event` text NOT NULL,
  `message` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`draft_id`) REFERENCES `answer_drafts`(`id`) ON UPDATE no action ON DELETE cascade
);
