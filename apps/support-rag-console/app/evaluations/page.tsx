import Link from "next/link";
import { AppShell } from "../../src/components/AppShell";
import {
  DetailRows,
  ConsoleTitle,
  ConsoleWorkspace,
} from "../../src/components/ConsoleWorkspace";
import { StatusBadge, type StatusTone } from "../../src/components/StatusBadge";
import { formatDateTime } from "../../src/lib/format";
import { getReviewedCases } from "../../src/lib/view-models";

export const dynamic = "force-dynamic";

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const cases = getReviewedCases();
  const selected =
    cases.find((item) => item.draft.id === params?.draft) ?? cases[0];
  const totalClaims = cases.reduce(
    (total, item) => total + item.groundingCheck.totalClaimCount,
    0,
  );
  const supportedClaims = cases.reduce(
    (total, item) => total + item.groundingCheck.supportedClaimCount,
    0,
  );
  const coverage = totalClaims ? Math.round((supportedClaims / totalClaims) * 100) : 0;
  const unsupportedCount = cases.reduce(
    (total, item) => total + item.draft.unsupportedClaims.length,
    0,
  );
  const blockedCount = cases.filter((item) =>
    ["blocked", "escalated", "rejected"].includes(item.reviewedDraft.status),
  ).length;
  const readyCount = cases.filter((item) =>
    ["approved", "ready_for_review"].includes(item.reviewedDraft.status),
  ).length;

  return (
    <AppShell
      eyebrow="Evaluations"
      title="Evaluations"
      meta="Quality gates across answer drafts."
      topbarItems={[
        { label: `Coverage ${coverage}%`, tone: coverage >= 90 ? "green" : "amber" },
        {
          label: `Unsupported ${unsupportedCount}`,
          tone: unsupportedCount > 0 ? "amber" : "green",
        },
        { label: `Runs ${cases.length}`, tone: "blue" },
      ]}
    >
      <ConsoleWorkspace
        filterTitle="Eval runs"
        filterSubtitle="Status scope"
        sections={[
          {
            title: "Eval runs",
            items: [
              { label: "Latest", value: 1, tone: "blue", active: true },
              { label: "Regressions", value: unsupportedCount, tone: "amber" },
              { label: "Passed", value: readyCount, tone: "green" },
              { label: "Archived", value: 0, tone: "muted" },
            ],
          },
        ]}
        inspector={<EvaluationInspector selected={selected} />}
      >
        <ConsoleTitle title="Evaluation matrix" meta="Quality gates across answer drafts" />

        <div className="metricStrip" aria-label="Evaluation summary">
          <MetricTile label="Citation coverage" value={`${coverage}%`} />
          <MetricTile
            label="Unsupported claims"
            tone={unsupportedCount > 0 ? "warning" : "default"}
            value={unsupportedCount}
          />
          <MetricTile
            label="Approval blocked"
            tone={blockedCount > 0 ? "critical" : "default"}
            value={blockedCount}
          />
          <MetricTile label="Ready drafts" value={readyCount} />
        </div>

        <div className="tableWrap">
          <table className="denseTable">
            <thead>
              <tr>
                <th>Draft</th>
                <th>Citations</th>
                <th>Unsupported</th>
                <th>Risk</th>
                <th>Decision</th>
                <th>Updated</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => {
                const unsupported = item.draft.unsupportedClaims.length;

                return (
                  <tr
                    className={
                      item.draft.id === selected.draft.id
                        ? "selected"
                        : unsupported > 0
                          ? "warningRow"
                          : undefined
                    }
                    key={item.draft.id}
                  >
                    <td className="clickableCell">
                      <Link
                        className="tableCellLink"
                        href={`/evaluations?draft=${item.draft.id}`}
                      >
                        <span className="tableCellTitle">{answerLabel(item.ticket.subject)}</span>
                        <span className="tableMeta">{item.ticket.customerName}</span>
                      </Link>
                    </td>
                    <td>
                      {item.groundingCheck.supportedClaimCount}/
                      {item.groundingCheck.totalClaimCount}
                    </td>
                    <td>{unsupported}</td>
                    <td>{item.draft.riskLevel}</td>
                    <td>
                      <StatusBadge
                        label={decisionLabel(item.reviewedDraft.status)}
                        tone={toneForStatus(item.reviewedDraft.status)}
                      />
                    </td>
                    <td>{formatDateTime(item.decision?.decidedAt ?? item.draft.createdAt)}</td>
                    <td>
                      <Link className="linkText" href={`/answers/${item.draft.id}`}>
                        Inspect
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ConsoleWorkspace>
    </AppShell>
  );
}

function EvaluationInspector({
  selected,
}: {
  selected: ReturnType<typeof getReviewedCases>[number];
}) {
  return (
    <>
      <span className="consoleInspectorLabel">Selected run</span>
      <div className="panelHeader" style={{ marginBottom: 26 }}>
        <div>
          <h2>{answerLabel(selected.ticket.subject)}</h2>
          <p className="subtle" style={{ marginBottom: 0 }}>
            {selected.ticket.id}
          </p>
        </div>
        <StatusBadge
          label={decisionLabel(selected.reviewedDraft.status)}
          tone={toneForStatus(selected.reviewedDraft.status)}
        />
      </div>

      <ConsoleTitle title="Metric details" meta="latest run" />
      <DetailRows
        rows={[
          {
            label: "Citations",
            value: `${selected.groundingCheck.supportedClaimCount}/${selected.groundingCheck.totalClaimCount}`,
          },
          {
            label: "Unsupported claims",
            value: selected.draft.unsupportedClaims.length,
          },
          {
            label: "Source freshness",
            value: "pass",
          },
          {
            label: "Readability",
            value:
              selected.reviewedDraft.status === "needs_edits"
                ? "needs edit"
                : "ready",
          },
        ]}
      />

      <div className="consoleBlock">
        <ConsoleTitle title="Gate policy" meta="thresholds" />
        <DetailRows
          rows={[
            { label: "Citation coverage", value: ">= 90%" },
            { label: "Unsupported claims", value: "must be 0" },
            { label: "Blocked decisions", value: "manual review" },
          ]}
        />
      </div>
    </>
  );
}

function MetricTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "critical";
}) {
  return (
    <div className={tone === "default" ? "metricTile" : `metricTile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function answerLabel(subject: string) {
  if (subject.includes("Promo")) {
    return "Discount answer";
  }

  if (subject.includes("Password")) {
    return "Account export answer";
  }

  if (subject.includes("Delivery")) {
    return "Shipping delay answer";
  }

  if (subject.includes("Damaged")) {
    return "Damage replacement answer";
  }

  if (subject.includes("Warranty")) {
    return "Warranty answer";
  }

  if (subject.includes("Gift")) {
    return "Gift card answer";
  }

  if (subject.includes("VAT")) {
    return "Invoice answer";
  }

  if (subject.includes("Address")) {
    return "Address change answer";
  }

  return "Return request answer";
}

function decisionLabel(status: string) {
  if (status === "approved" || status === "ready_for_review") {
    return "Ready";
  }

  if (status === "needs_edits") {
    return "Needs edit";
  }

  if (status === "escalated") {
    return "Blocked";
  }

  return status.replaceAll("_", " ");
}

function toneForStatus(status: string): StatusTone {
  if (status === "approved" || status === "ready_for_review") {
    return "green";
  }

  if (status === "blocked" || status === "escalated" || status === "rejected") {
    return "red";
  }

  if (status === "needs_review" || status === "needs_edits") {
    return "amber";
  }

  return "muted";
}
