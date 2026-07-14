# Five-minute reviewer guide

TelcoAssist is a human-in-the-loop telecom support prototype. The strongest part of the project is the complete review workflow: privacy processing, deterministic decision support, evidence-linked guidance, agent feedback, and operational visibility are presented as one product rather than isolated notebooks.

## Suggested review path

1. Open the [live showcase](https://barissolcay.github.io/telecom-support-intelligence/) and continue as a support agent.
2. Filter the inbox by confidence and open `TK-1042`.
3. Review the redacted conversation, classification, priority signals, extracted entities, similar cases, and active sources.
4. Generate a draft, record classification feedback, and resolve the ticket.
5. Return to the sidebar and inspect Operations, Knowledge base, and Model health.

The GitHub Pages showcase keeps changes in the browser session. The Docker path persists ticket, message, assignment, feedback, and resolution changes in PostgreSQL.

## What is implemented

| Area | Implementation |
| --- | --- |
| Product UI | Responsive React/Vite showcase with agent and team-lead flows |
| API | FastAPI endpoints for tickets, analysis, retrieval, grounded guidance, feedback, knowledge, and analytics |
| Persistence | SQLAlchemy repository backed by PostgreSQL in Docker; in-memory repository for tests/local fallback |
| Privacy | Deterministic masking for phone, e-mail, IP, MAC, card-like, national-ID, and subscriber values |
| Ticket intelligence | Runtime taxonomy classifier, priority safety rules, entity extraction, and follow-up prompts |
| Retrieval | Product-filtered deterministic lexical ranker; separately tested Qdrant query contract |
| Grounded guidance | Active-source filtering, source-linked steps, and insufficient-evidence refusal |
| Evaluation | Group-split offline classifier evaluation and small component regression suites |
| Delivery | Docker Compose, GitHub Actions CI, CodeQL, Dependabot, releases, and GitHub Pages |

## Deliberate boundaries

- No real customer or operator data is included.
- No answer is sent to a customer automatically.
- The Qdrant adapter is not active in the default demo request path.
- The offline TF-IDF artifact is evaluated but not served by the API.
- Perfect synthetic fixture scores are not presented as production performance.
- Authentication, authorization, operator integrations, and production observability require a separate production design.

## Verification

```bash
pip install -e ".[dev]"
npm --prefix apps/web ci
make test
docker compose config --quiet
```

For a persistent end-to-end run:

```bash
docker compose up --build
```

Then open `http://localhost:8080` and inspect the OpenAPI contract at `http://localhost:8000/docs`.
