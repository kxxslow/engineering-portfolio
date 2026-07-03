import Link from "next/link";
import { AppShell } from "../../src/components/AppShell";
import {
  DetailRows,
  ConsoleTitle,
  ConsoleWorkspace,
} from "../../src/components/ConsoleWorkspace";
import { StatusBadge, type StatusTone } from "../../src/components/StatusBadge";
import { formatDateTime } from "../../src/lib/format";
import {
  getKnowledgeLibrary,
  getReviewedCases,
} from "../../src/lib/view-models";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>;
}) {
  const params = await searchParams;
  const library = getKnowledgeLibrary();
  const cases = getReviewedCases();
  const rows = library.map((article) => {
    const facts = article.chunks.flatMap((chunk) => chunk.facts);
    const relatedCases = cases.filter(
      (item) =>
        item.draft.citations.some((citation) => citation.articleId === article.id) ||
        item.retrievedSources.some((source) => source.articleId === article.id),
    );
    const gapCount = relatedCases.reduce(
      (total, item) => total + item.draft.unsupportedClaims.length,
      0,
    );
    const coverage =
      gapCount === 0 ? "100%" : `${Math.round((facts.length / (facts.length + gapCount)) * 100)}%`;

    return {
      article,
      facts,
      relatedCases,
      gapCount,
      coverage,
    };
  });
  const selected =
    rows.find((row) => row.article.id === params?.source) ?? rows[0];
  const evidenceGaps = cases.flatMap((item) =>
    item.draft.unsupportedClaims.map((claim) => ({
      id: claim.id,
      claim: claim.text,
      caseName: item.ticket.subject,
      source:
        item.retrievedSources[0]
          ? library.find((article) => article.id === item.retrievedSources[0]?.articleId)
              ?.title ?? "Source review"
          : "No matching source",
      status: item.groundingCheck.result === "blocked" ? "Source gap" : "Needs source",
    })),
  );
  const totalFacts = rows.reduce((total, row) => total + row.facts.length, 0);
  const openGapCount = evidenceGaps.length;
  const collectionCounts = new Map<string, number>();
  rows.forEach((row) => {
    collectionCounts.set(
      row.article.category,
      (collectionCounts.get(row.article.category) ?? 0) + 1,
    );
  });

  return (
    <AppShell
      eyebrow="Evidence library"
      title="Source Library"
      meta="Published support articles and source coverage."
      topbarItems={[
        { label: `Sources ${library.length}`, tone: "green" },
        { label: `Facts ${totalFacts}`, tone: "blue" },
        { label: `Open gaps ${openGapCount}`, tone: openGapCount > 0 ? "amber" : "green" },
        { label: "Knowledge sources only", tone: "blue" },
      ]}
    >
      <ConsoleWorkspace
        filterTitle="Scope"
        filterSubtitle="Status scope"
        sections={[
          {
            title: "Scope",
            items: [
              { label: "All", value: library.length, tone: "blue", active: true },
              {
                label: "Published",
                value: rows.filter((row) => row.article.status === "published").length,
                tone: "green",
              },
              {
                label: "Needs review",
                value: rows.filter((row) => row.gapCount > 0).length,
                tone: "amber",
              },
              { label: "Archived", value: 0, tone: "muted" },
            ],
          },
          {
            title: "Collections",
            items: [...collectionCounts.entries()].map(([label, value]) => ({
              label,
              value,
              tone: "blue" as const,
            })),
          },
          {
            title: "Coverage",
            items: [
              {
                label: "Grounded",
                value: rows.filter((row) => row.gapCount === 0).length,
                tone: "green",
              },
              {
                label: "Review",
                value: rows.filter((row) => row.gapCount > 0).length,
                tone: "amber",
              },
            ],
          },
        ]}
        inspector={
          selected ? (
            <SourceInspector
              facts={selected.facts}
              gapCount={selected.gapCount}
              relatedCases={selected.relatedCases}
              row={selected}
            />
          ) : null
        }
      >
        <ConsoleTitle
          title="Source entries"
          meta="Published sources and review gaps"
          action={
            <StatusBadge
              label={openGapCount > 0 ? "Open gaps" : "Clear"}
              tone={openGapCount > 0 ? "amber" : "green"}
            />
          }
        />

        <div className="tableWrap">
          <table className="denseTable">
            <thead>
              <tr>
                <th>Source</th>
                <th>Collection</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Coverage</th>
                <th>Facts</th>
                <th>Cases</th>
                <th>Gaps</th>
              </tr>
            </thead>
            <tbody>
              <tr className="tableGroupRow">
                <td colSpan={8}>Published sources</td>
              </tr>
              {rows.map((row) => (
                <tr
                  className={
                    row.article.id === selected?.article.id
                      ? "selected"
                      : row.gapCount > 0
                        ? "warningRow"
                        : undefined
                  }
                  key={row.article.id}
                >
                  <td className="clickableCell">
                    <Link className="tableCellLink" href={`/library?source=${row.article.id}`}>
                      <span className="tableCellTitle">{row.article.title}</span>
                      <span className="tableMeta">updated {formatDateTime(row.article.updatedAt)}</span>
                    </Link>
                  </td>
                  <td>{row.article.category}</td>
                  <td>{row.article.owner}</td>
                  <td>
                    <StatusBadge label={row.article.status} tone="green" />
                  </td>
                  <td>{row.coverage}</td>
                  <td>{row.facts.length}</td>
                  <td>{row.relatedCases.length}</td>
                  <td>
                    <StatusBadge
                      label={`${row.gapCount}`}
                      tone={row.gapCount > 0 ? "amber" : "green"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="consoleQueue consoleBlock">
          <ConsoleTitle title="Open evidence gaps" meta={`${openGapCount} pending source gaps`} />
          {evidenceGaps.length > 0 ? (
            evidenceGaps.map((gap) => (
              <div className="queueRow" key={gap.id}>
                <div>
                  <strong>{shortClaim(gap.claim)}</strong>
                  <span className="tableMeta">
                    {gap.source} / {gap.caseName}
                  </span>
                </div>
                <StatusBadge label={gap.status} tone="amber" />
              </div>
            ))
          ) : (
            <p className="subtle" style={{ marginBottom: 0 }}>
              No open source gaps.
            </p>
          )}
        </div>
      </ConsoleWorkspace>
    </AppShell>
  );
}

function SourceInspector({
  row,
  facts,
  relatedCases,
  gapCount,
}: {
  row: {
    article: ReturnType<typeof getKnowledgeLibrary>[number];
    coverage: string;
  };
  facts: ReturnType<typeof getKnowledgeLibrary>[number]["chunks"][number]["facts"];
  relatedCases: ReturnType<typeof getReviewedCases>;
  gapCount: number;
}) {
  const outlineRows = row.article.chunks.map((chunk) => ({
    label: chunk.heading,
    value: firstSentence(chunk.content),
  }));
  const factRows = facts.slice(0, 4).map((fact) => ({
    label: fact.id,
    value: fact.statement,
  }));
  const usageRows =
    relatedCases.length > 0
      ? relatedCases.map((item) => ({
          label: item.ticket.subject,
          value: item.reviewedDraft.status.replaceAll("_", " "),
        }))
      : [{ label: "Answer usage", value: "No active answer uses this source." }];

  return (
    <>
      <span className="consoleInspectorLabel">Selected source</span>
      <div className="panelHeader" style={{ marginBottom: 18 }}>
        <div>
          <h2>{row.article.title}</h2>
          <p className="subtle" style={{ marginBottom: 0 }}>
            {row.article.category} / {row.article.owner} / updated{" "}
            {formatDateTime(row.article.updatedAt)}
          </p>
        </div>
        <StatusBadge label={row.article.status} tone="green" />
      </div>

      <h3>Article outline</h3>
      <DetailRows rows={outlineRows} />

      <h3>Source facts</h3>
      <DetailRows rows={factRows} />

      <h3>Answer usage</h3>
      <DetailRows rows={usageRows} />

      <h3>Coverage status</h3>
      <DetailRows
        rows={[
          { label: "Coverage", value: row.coverage },
          {
            label: gapCount > 0 ? "Open gaps" : "No gaps on selected source",
            value:
              gapCount > 0
                ? `${gapCount} source ${gapCount === 1 ? "gap" : "gaps"} need review.`
                : "Ready for reviewer answer use.",
          },
        ]}
      />
    </>
  );
}

function firstSentence(value: string) {
  return value.split(".")[0] + ".";
}

function shortClaim(value: string) {
  if (value.includes("welcome code")) {
    return "Promo stacking claim";
  }

  if (value.includes("password") || value.includes("transcript")) {
    return "Account export availability";
  }

  if (value.includes("overnight replacement")) {
    return "Replacement timing claim";
  }

  if (value.includes("cash out")) {
    return "Gift card payout claim";
  }

  if (value.includes("reroute")) {
    return "Carrier reroute claim";
  }

  return value;
}
