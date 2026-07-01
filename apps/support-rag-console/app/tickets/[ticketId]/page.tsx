import { notFound } from "next/navigation";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Quote,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "../../../src/components/AppShell";
import { DraftCard } from "../../../src/components/DraftCard";
import { EvidenceInspector } from "../../../src/components/EvidenceInspector";
import {
  StatusBadge,
  type StatusTone,
} from "../../../src/components/StatusBadge";
import { Button } from "../../../src/components/ui/button";
import { formatDateTime } from "../../../src/lib/format";
import { getGeneratedCase, supportTickets } from "../../../src/lib/view-models";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return supportTickets.map((ticket) => ({ ticketId: ticket.id }));
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const result = getGeneratedCase(ticketId);

  if (!result) {
    notFound();
  }

  const unsupportedCount = result.draft.unsupportedClaims.length;

  return (
    <AppShell
      eyebrow="Ticket detail"
      title={result.ticket.subject}
      meta={result.ticket.customerName}
    >
      <section
        className="grid detailMetrics"
        aria-label="Ticket detail metrics"
      >
        <Metric
          icon={MessageSquare}
          label="Ticket status"
          value={result.ticket.status.replaceAll("_", " ")}
          hint={result.ticket.channel}
        />
        <Metric
          icon={Quote}
          label="Citations"
          value={result.draft.citations.length}
          hint="Attached source facts"
        />
        <Metric
          icon={CheckCircle2}
          label="Claim support"
          value={`${result.groundingCheck.supportedClaimCount}/${result.groundingCheck.totalClaimCount}`}
          hint="Grounded claims"
        />
        <Metric
          icon={ShieldAlert}
          label="Unsupported"
          value={unsupportedCount}
          hint="Review rule count"
        />
      </section>

      <section className="ticketDetailLayout">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h2>Support ticket</h2>
              <p className="subtle">
                {formatDateTime(result.ticket.createdAt)}
              </p>
            </div>
            <StatusBadge
              label={result.ticket.status}
              tone={toneForTicket(result.ticket.status)}
            />
          </div>
          <dl className="detailList">
            <div className="detailRow">
              <dt>Question</dt>
              <dd>{result.ticket.question}</dd>
            </div>
            <div className="detailRow">
              <dt>Channel</dt>
              <dd>{result.ticket.channel}</dd>
            </div>
            <div className="detailRow">
              <dt>Priority</dt>
              <dd>{result.ticket.priority}</dd>
            </div>
            <div className="detailRow">
              <dt>Intent</dt>
              <dd>{result.ticket.intent.replaceAll("_", " ")}</dd>
            </div>
          </dl>
          <p className="footerNote">
            <Link className="linkText" href={`/answers/${result.draft.id}`}>
              Open answer evidence inspector
            </Link>
          </p>
        </div>

        <aside className="grid railStack">
          <div className="panel">
            <div className="panelHeader">
              <h2>Review state</h2>
              <StatusBadge
                label={result.draft.status}
                tone={toneForTicket(result.draft.status)}
              />
            </div>
            {unsupportedCount > 0 ? (
              <div className="warningBox">
                <h3 className="iconTitle">
                  <AlertTriangle aria-hidden="true" size={15} />
                  Evidence required
                </h3>
                <p style={{ marginBottom: 0 }}>
                  Unsupported claims must be edited or escalated before the
                  answer can move to approval.
                </p>
              </div>
            ) : (
              <div className="railSummary">
                <strong className="iconTitle">
                  <CheckCircle2 aria-hidden="true" size={15} />
                  Claims cited
                </strong>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  All answer claims have citations and source facts attached.
                </p>
              </div>
            )}
            <div
              className="buttonRow"
              style={{ marginBottom: 0, marginTop: 14 }}
            >
              <Button asChild className="primaryAction" size="sm">
                <Link href={`/answers/${result.draft.id}`}>Open answer</Link>
              </Button>
            </div>
          </div>

          <div className="panel">
            <h2>Evidence summary</h2>
            <dl className="detailList">
              <div className="detailRow">
                <dt>Quality</dt>
                <dd>{result.groundingCheck.qualityScore}%</dd>
              </div>
              <div className="detailRow">
                <dt>Sources</dt>
                <dd>{result.groundingCheck.relevantSourceCount}</dd>
              </div>
              <div className="detailRow">
                <dt>Risk</dt>
                <dd>{result.groundingCheck.riskLevel}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panelHeader">
          <div>
            <h2>Draft and evidence</h2>
            <p className="subtle">
              Answer draft, retrieved sources, and citations for reviewer
              verification.
            </p>
          </div>
          <StatusBadge
            label={`${result.draft.citations.length} citations`}
            tone={result.draft.citations.length > 0 ? "green" : "red"}
          />
        </div>
        <div className="ticketEvidenceGrid">
          <DraftCard result={result} />
          <EvidenceInspector result={result} />
        </div>
      </section>
    </AppShell>
  );
}

function toneForTicket(status: string): StatusTone {
  if (
    status === "closed" ||
    status === "approved" ||
    status === "ready_for_review"
  ) {
    return "green";
  }

  if (status === "escalated" || status === "blocked" || status === "rejected") {
    return "red";
  }

  if (status === "needs_review" || status === "needs_edits") {
    return "amber";
  }

  return "blue";
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="metric">
      <span className="metricIcon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="metricLabel">{label}</span>
      <span className="metricValue detailMetricValue">{value}</span>
      <span className="metricHint">{hint}</span>
    </div>
  );
}
