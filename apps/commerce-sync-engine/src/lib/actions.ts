"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabasePath, withCommerceDb } from "@/db/client";
import { resetCommerceDatabase } from "@/db/reset";
import {
  executePendingRows,
  getLatestDryRun,
  planDryRun,
  retryFailedRows
} from "@/lib/sync-service";

function liveId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export async function runDryRunAction() {
  const runId = liveId("sync-run-live-dry-run");

  withCommerceDb((db) => {
    planDryRun(db, {
      runId,
      createdAt: new Date().toISOString()
    });
  });

  revalidatePath("/");
  revalidatePath("/diff");
  redirect("/diff");
}

export async function executeLatestDryRunAction() {
  let runId = "";

  withCommerceDb((db) => {
    const latest = getLatestDryRun(db);
    if (!latest) {
      const dryRunId = liveId("sync-run-live-dry-run");
      planDryRun(db, {
        runId: dryRunId,
        createdAt: new Date().toISOString()
      });
    }

    const sourceRun = getLatestDryRun(db);
    if (!sourceRun) {
      throw new Error("No dry-run exists to execute.");
    }

    runId = liveId("sync-run-live-exec");
    executePendingRows(db, {
      sourceRunId: sourceRun.id,
      runId,
      createdAt: new Date().toISOString()
    });
  });

  revalidatePath("/");
  revalidatePath("/diff");
  revalidatePath("/log");
  redirect(`/runs/${runId}`);
}

export async function retryRunAction(formData: FormData) {
  const parentRunId = String(formData.get("parentRunId") ?? "");
  const fixedRunId = String(formData.get("retryRunId") ?? "");
  const runId = fixedRunId || liveId("sync-run-live-retry");

  if (!parentRunId) {
    throw new Error("Missing parent run id.");
  }

  withCommerceDb((db) => {
    retryFailedRows(db, {
      parentRunId,
      runId,
      createdAt: new Date().toISOString()
    });
  });

  revalidatePath("/");
  revalidatePath("/log");
  redirect(`/runs/${runId}`);
}

export async function resetDemoAction() {
  resetCommerceDatabase(getDatabasePath(), true);
  revalidatePath("/");
  revalidatePath("/diff");
  revalidatePath("/records");
  revalidatePath("/log");
  redirect("/");
}
