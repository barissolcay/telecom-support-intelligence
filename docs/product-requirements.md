# Product requirements

TelcoAssist is a decision-support product for telecom support agents, not an autonomous customer bot. The V1 must accept synthetic Turkish and English tickets, redact PII, classify the issue and priority, extract structured context, retrieve relevant resolved cases and active knowledge, refuse unsupported guidance, collect human feedback, and expose operational analytics.

## Personas

- Support agents review tickets, evidence, response drafts, and resolution summaries.
- Team leads monitor workload, critical queues, incident signals, and AI adoption.
- Knowledge managers govern active, deprecated, and archived procedures.
- ML engineers compare measured quality, latency, calibration, and drift.

## Acceptance flow

1. Create a ticket and validate its schema.
2. Redact PII before downstream processing.
3. Generate category, subcategory, priority, summary, entities, and review signals.
4. Retrieve successful cases and active knowledge.
5. Generate only evidence-supported recommendations.
6. Require an agent to accept, edit, or reject outputs.
7. Save structured resolution and feedback.
8. Reflect events in operations analytics.
