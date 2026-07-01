# support-rag-console

Next.js + SQLite/Drizzle support review and evidence console.

## Stack

- Next.js
- TypeScript
- shadcn/ui-style local components
- lucide-react
- SQLite
- Drizzle ORM

## Functional behavior

- Tickets, answer drafts, sources, citations, evaluations, review decisions, and review events are persisted in local SQLite.
- Answer evaluation is deterministic and rule-based, with no model call.
- Citation coverage is calculated from local source chunks and source facts.
- Unsupported claims are flagged and unsafe or insufficient-evidence answers are blocked or escalated.
- Reviewer actions approve grounded drafts, request edits, or block/escalate unsafe drafts.
- Review decision history, evaluation history, citation evidence, and review history are visible in the UI.

No real LLM API, vector database, external support API, auth, queue, Redis, Docker, or external service is used.

## Local commands

```powershell
cd apps/support-rag-console
npm install
npm run db:reset
npm run dev -- -p 4103
```

Open:

```txt
http://127.0.0.1:4103
```

Validate:

```powershell
cd apps/support-rag-console
npm run db:reset
npm run typecheck
npm test
npm run build
```

## Reviewer path

1. Open `/` for the review readiness checklist and persisted review posture.
2. Open `/assistant` for Answer Review.
3. Open `/review` for Decision Log.
4. Open `/library` for Source Library.
5. Open `/evaluations` for citation coverage, unsupported claims, review history, and review rules.
6. Open `/settings` for source policy and review guardrails.
7. Open `/answers/draft-ticket-return-iris` to inspect a grounded answer with citations.
8. Open `/answers/draft-ticket-discount-omar` or `/answers/draft-ticket-account-nora` to inspect blocked or edit-required guardrails.
