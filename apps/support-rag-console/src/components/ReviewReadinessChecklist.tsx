import { getProofStatus } from "../lib/view-models";
import { StatusBadge } from "./StatusBadge";
import { Card } from "./ui/card";

const readinessItems = [
  {
    key: "groundedAnswerAllowed",
    title: "Grounded answer allowed",
    description:
      "A return-policy question can draft an answer only when every planned claim is supported.",
    meta: "ticket-return-iris",
  },
  {
    key: "citationsAttached",
    title: "Citations attached",
    description:
      "Grounded answers include citations to specific source facts and chunks.",
    meta: "source facts",
  },
  {
    key: "missingSourcesBlocked",
    title: "Missing sources blocked",
    description:
      "An account-access question with no adequate source produces escalation instead of an answer.",
    meta: "ticket-account-nora",
  },
  {
    key: "unsupportedClaimsFlagged",
    title: "Unsupported claims flagged",
    description:
      "A risky discount claim is kept out of confident-answer flow until reviewed.",
    meta: "ticket-discount-omar",
  },
  {
    key: "reviewDecisionsSafe",
    title: "Review changes status safely",
    description:
      "Approval works for grounded drafts, while risky or blocked drafts cannot be approved directly.",
    meta: "human review",
  },
] as const;

export function ReviewReadinessChecklist() {
  const status = getProofStatus();

  return (
    <Card className="panel readinessPanel">
      <div className="panelHeader">
        <div>
          <h2>Review readiness checklist</h2>
          <p className="subtle">
            These checks summarize source coverage, unsupported claims, and
            reviewer decisions.
          </p>
        </div>
        <StatusBadge label="review checks active" tone="green" />
      </div>

      <div className="readinessGrid">
        {readinessItems.map((item) => {
          const passed = status[item.key];

          return (
            <article className="readinessItem" key={item.key}>
              <div className="readinessItemHeader">
                <strong>{item.title}</strong>
                <StatusBadge
                  label={passed ? "passes" : "review"}
                  tone={passed ? "green" : "amber"}
                />
              </div>
              <p className="subtle">{item.description}</p>
              <p className="readinessMeta">{item.meta}</p>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
