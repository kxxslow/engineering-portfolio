import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  FileText,
  MessageSquare,
  Quote,
  UserCheck,
} from "lucide-react";
import { AppShell } from "../src/components/AppShell";
import { DraftCard } from "../src/components/DraftCard";
import { ReviewReadinessChecklist } from "../src/components/ReviewReadinessChecklist";
import { ReviewDecisionTable } from "../src/components/ReviewDecisionTable";
import { StatusBadge } from "../src/components/StatusBadge";
import {
  getDashboardStats,
  getGeneratedCase,
  getReviewQueue,
} from "../src/lib/view-models";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const groundedCase = getGeneratedCase("ticket-return-iris");
  const reviewQueue = getReviewQueue();

  return (
    <AppShell
      eyebrow="Grounded support review"
      title="Support review operations console"
      meta="Source coverage and review state"
    >
      <section className="grid metrics" aria-label="Support review metrics">
        <Metric
          icon={MessageSquare}
          label="Tickets"
          value={stats.tickets}
          hint="Active support cases"
        />
        <Metric
          icon={BookOpen}
          label="KB articles"
          value={stats.knowledgeArticles}
          hint="Published source set"
        />
        <Metric
          icon={UserCheck}
          label="Ready drafts"
          value={stats.readyDrafts}
          hint="Fully grounded"
        />
        <Metric
          icon={AlertTriangle}
          label="Needs review"
          value={stats.needsReview}
          hint="Claim risk visible"
        />
        <Metric
          icon={FileText}
          label="Escalations"
          value={stats.escalations}
          hint="Evidence gap"
        />
        <Metric
          icon={Quote}
          label="Citations"
          value={stats.citations}
          hint="Source facts"
        />
      </section>

      <ReviewReadinessChecklist />

      <section className="grid twoColumn">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h2>Evidence-backed draft snapshot</h2>
              <p className="subtle">
                This draft is allowed because all planned claims map to
                retrieved source facts.
              </p>
            </div>
            <Link className="linkText" href="/tickets/ticket-return-iris">
              Open ticket
            </Link>
          </div>
          {groundedCase ? <DraftCard result={groundedCase} /> : null}
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <h2>Review posture</h2>
              <p className="subtle">
                Human review decisions are applied after the evidence check,
                not instead of it.
              </p>
            </div>
            <StatusBadge label={`${reviewQueue.length} queued`} tone="amber" />
          </div>
          <ReviewDecisionTable />
        </div>
      </section>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="metric">
      <span className="metricIcon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="metricLabel">{label}</span>
      <span className="metricValue">{value}</span>
      <span className="metricHint">{hint}</span>
    </div>
  );
}
