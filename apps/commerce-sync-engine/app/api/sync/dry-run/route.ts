import { NextResponse, type NextRequest } from "next/server";

import { withCommerceDb } from "@/db/client";
import { planDryRun } from "@/lib/sync-service";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
    createdAt?: string;
  };
  const runId = body.runId ?? `sync-run-api-dry-run-${Date.now()}`;
  const createdAt = body.createdAt ?? new Date().toISOString();

  const result = withCommerceDb((db) => planDryRun(db, { runId, createdAt }));

  return NextResponse.json({
    run: result.run,
    itemCount: result.items.length
  });
}
