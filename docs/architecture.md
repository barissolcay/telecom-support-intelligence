# Architecture

TelcoAssist uses a modular monolith for the product API and a separate React web client. Domain modules under `src/telcoassist` isolate privacy, classification, priority, entities, retrieval, grounded response generation, knowledge, feedback, storage, and analytics.

The request path is privacy-first: raw input is validated, redacted, and only then supplied to intelligence modules. Classification and case retrieval remain available with the LLM disabled. Knowledge retrieval refuses if no active source meets the relevance threshold. Docker uses PostgreSQL as the working system of record; local tests use an in-memory repository. The Qdrant module defines and tests an optional hybrid-query boundary but is not called by the default demo path.

## Implemented request path

1. FastAPI validates ticket input and redacts deterministic PII patterns.
2. The deterministic taxonomy and priority rules produce reviewable signals.
3. PostgreSQL or the in-memory repository stores only redacted ticket/message content.
4. The lexical ranker retrieves product-filtered cases and active knowledge.
5. The grounded response service emits source-linked steps or refuses.
6. Agent assignment, messages, feedback, and resolution are persisted through API mutations.

## Key decisions

- The linear baseline is the default because CPU latency and explainability matter in agent workflows.
- Priority safety rules override model output for stolen SIM, unauthorized transactions, security risk, and multi-subscriber outage language.
- Document content is untrusted data. It cannot override system behavior.
- Deprecated and archived documents are excluded from default retrieval.
- No generated response is sent automatically.
- The offline TF-IDF candidate is evaluated by the training pipeline but is not loaded by the demo API.
