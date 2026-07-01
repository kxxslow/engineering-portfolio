import type { DraftGenerationResult } from "../lib/rag";
import { getSourceChunk } from "../lib/view-models";
import { StatusBadge, type StatusTone } from "./StatusBadge";

export function EvidenceInspector({
  result,
}: {
  result: DraftGenerationResult;
}) {
  return (
    <div className="evidenceStack">
      <div>
        <div className="panelHeader">
          <div>
            <h2>Retrieved sources</h2>
            <p className="subtle">
              Source matches come from published knowledge chunks.
            </p>
          </div>
          <StatusBadge
            label={`${result.retrievedSources.length} sources`}
            tone={countTone(result.retrievedSources.length)}
          />
        </div>
        {result.retrievedSources.length > 0 ? (
          <div className="sourceList">
            {result.retrievedSources.map((source) => {
              const chunk = getSourceChunk(source.chunkId);

              return (
                <article className="sourceItem" key={source.chunkId}>
                  <div className="panelHeader">
                    <div>
                      <strong>{chunk?.heading ?? source.chunkId}</strong>
                      <p className="subtle">
                        Matched: {source.matchedTerms.join(", ")}
                      </p>
                    </div>
                    <StatusBadge label={`score ${source.score}`} tone="muted" />
                  </div>
                  <p>{source.excerpt}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="emptyState">
            No source met the retrieval threshold. The answer stays blocked.
          </p>
        )}
      </div>

      <div>
        <div className="panelHeader">
          <div>
            <h2>Citations</h2>
            <p className="subtle">
              Every citation points to a source fact used by a supported claim.
            </p>
          </div>
          <StatusBadge
            label={`${result.draft.citations.length} citations`}
            tone={countTone(result.draft.citations.length)}
          />
        </div>
        {result.draft.citations.length > 0 ? (
          <ol className="citationList">
            {result.draft.citations.map((citation) => (
              <li key={citation.id}>
                <strong>{citation.label}</strong>
                <p>{citation.quote}</p>
                <span className="inlineMeta">
                  {citation.factId} / {citation.chunkId}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="emptyState">
            No citations are attached because the draft is not grounded.
          </p>
        )}
      </div>
    </div>
  );
}

function countTone(count: number): StatusTone {
  return count > 0 ? "green" : "red";
}
