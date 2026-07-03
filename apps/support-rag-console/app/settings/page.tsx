import { AppShell } from "../../src/components/AppShell";
import {
  ConsoleTitle,
  ConsoleWorkspace,
} from "../../src/components/ConsoleWorkspace";
import { StatusBadge } from "../../src/components/StatusBadge";
import { getKnowledgeLibrary } from "../../src/lib/view-models";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const library = getKnowledgeLibrary();
  const publishedCount = library.filter((article) => article.status === "published").length;

  return (
    <AppShell
      eyebrow="Settings"
      title="Settings"
      meta="Policies that gate reviewer approval."
      topbarItems={[
        { label: "Policy active", tone: "green" },
        { label: "Evidence rules", tone: "blue" },
      ]}
    >
      <ConsoleWorkspace
        filterTitle="Settings"
        filterSubtitle="Status scope"
        sections={[
          {
            title: "Settings",
            items: [
              { label: "Policies", value: 4, tone: "blue", active: true },
              { label: "Review gates", value: 3, tone: "green" },
              { label: "Sources", value: publishedCount, tone: "amber" },
              { label: "Display", value: 0, tone: "muted" },
            ],
          },
        ]}
      >
        <ConsoleTitle
          title="Review settings"
          meta="Policies that gate reviewer approval."
        />

        <section className="consoleBlock" style={{ borderTop: 0, marginTop: 30, paddingTop: 0 }}>
          <ConsoleTitle
            title="Evidence policy"
            meta="Controls how source facts support answer drafts."
          />
          <div className="policyRows">
            <PolicyRow
              label="Published sources only"
              status="Enabled"
              tone="green"
              text="Answers may cite only sources marked as published or explicitly approved."
            />
            <PolicyRow
              label="Unsupported claim gate"
              status="Required"
              tone="amber"
              text="Any unsupported claim holds approval until rewritten or sourced."
            />
            <PolicyRow
              label="Citation coverage threshold"
              status="90% min"
              tone="blue"
              text="Reviewer-ready answers require high source fact coverage."
            />
          </div>
        </section>

        <section className="consoleBlock">
          <ConsoleTitle
            title="Review decisions"
            meta="Actions visible to reviewers and the rules behind each state."
          />
          <div className="policyRows">
            <PolicyRow
              label="Approve"
              status="Guarded"
              tone="green"
              text="Enabled only when evidence coverage passes and unsupported claims are zero."
            />
            <PolicyRow
              label="Request edit"
              status="Default"
              tone="blue"
              text="Used when an answer is grounded but phrasing or completeness needs revision."
            />
            <PolicyRow
              label="Block"
              status="Manual"
              tone="red"
              text="Used when claims lack approved source support."
            />
          </div>
        </section>

        <section className="consoleBlock">
          <ConsoleTitle
            title="Source freshness"
            meta="Knowledge source rules used by the library and evaluation pages."
          />
          <div className="policyRows">
            <PolicyRow
              label="Stale source policy"
              status="Active"
              tone="amber"
              text="Older sources are shown as needs-review policy items."
            />
          </div>
        </section>
      </ConsoleWorkspace>
    </AppShell>
  );
}

function PolicyRow({
  label,
  text,
  status,
  tone,
}: {
  label: string;
  text: string;
  status: string;
  tone: "blue" | "green" | "amber" | "red";
}) {
  return (
    <div className="policyRow">
      <div>
        <strong>{label}</strong>
        <p>{text}</p>
      </div>
      <StatusBadge label={status} tone={tone} />
    </div>
  );
}
