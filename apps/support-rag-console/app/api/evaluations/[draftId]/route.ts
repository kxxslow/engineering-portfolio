import { NextResponse } from "next/server";

import { withSupportDb } from "@/db/client";
import { evaluateAnswerDraft } from "@/lib/support-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const result = withSupportDb((db) => evaluateAnswerDraft(db, draftId));

  return NextResponse.json({
    draftId: result.draft.id,
    result: result.groundingCheck.result,
    citationCount: result.draft.citations.length,
    unsupportedClaimCount: result.draft.unsupportedClaims.length
  });
}
