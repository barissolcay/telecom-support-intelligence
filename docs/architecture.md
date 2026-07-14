# Architecture

TelcoAssist uses a modular monolith for the product API and separate runtime processes for the web client and background indexing. Domain modules under `src/telcoassist` isolate privacy, classification, priority, entities, retrieval, RAG, knowledge, feedback, and analytics.

The request path is privacy-first: raw input is validated, redacted, and only then supplied to intelligence modules. Classification and case retrieval remain available if an LLM is disabled. Knowledge retrieval refuses if no active source meets the relevance threshold. PostgreSQL is the intended system of record and Qdrant is the intended vector store; the repository also contains deterministic demo services so reviewers can run the workflow without external credentials.

## Key decisions

- The linear baseline is the default because CPU latency and explainability matter in agent workflows.
- Priority safety rules override model output for stolen SIM, unauthorized transactions, security risk, and multi-subscriber outage language.
- Document content is untrusted data. It cannot override system behavior.
- Deprecated and archived documents are excluded from default retrieval.
- No generated response is sent automatically.
