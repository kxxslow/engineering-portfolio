"use server";

import { revalidatePath } from "next/cache";

import { getDatabasePath, withSupportDb } from "@/db/client";
import { resetSupportDatabase } from "@/db/reset";
import {
  evaluateAnswerDraft,
  persistReviewDecision,
} from "@/lib/support-service";
import type { ReviewAction } from "@/lib/rag";

const revalidatedPaths = [
  "/",
  "/assistant",
  "/review",
  "/library",
  "/evaluations",
  "/settings",
];

export async function evaluateDraftAction(formData: FormData) {
  const draftId = requireString(formData.get("draftId"), "draftId");

  withSupportDb((db) => {
    evaluateAnswerDraft(db, draftId);
  });

  revalidateSupportPaths(draftId);
}

export async function reviewDecisionAction(formData: FormData) {
  const draftId = requireString(formData.get("draftId"), "draftId");
  const decision = requireString(
    formData.get("decision"),
    "decision",
  ) as ReviewAction;
  const notes =
    formData.get("notes")?.toString() || defaultNotesForDecision(decision);

  withSupportDb((db) => {
    persistReviewDecision(db, {
      draftId,
      decision,
      notes,
    });
  });

  revalidateSupportPaths(draftId);
}

export async function resetDemoAction() {
  resetSupportDatabase(getDatabasePath());
  for (const path of revalidatedPaths) {
    revalidatePath(path);
  }
}

function revalidateSupportPaths(draftId: string) {
  for (const path of revalidatedPaths) {
    revalidatePath(path);
  }
  revalidatePath(`/answers/${draftId}`);
}

function requireString(value: FormDataEntryValue | null, name: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function defaultNotesForDecision(decision: ReviewAction) {
  if (decision === "approve") {
    return "Reviewer approved after checking citation coverage and unsupported claims.";
  }

  if (decision === "request_edits") {
    return "Reviewer requested edits before this answer can be sent.";
  }

  if (decision === "escalate") {
    return "Reviewer blocked reply and escalated because evidence is insufficient or unsafe.";
  }

  return "Reviewer rejected the current draft.";
}
