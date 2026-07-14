# Synthetic ticket dataset card

## Purpose

The dataset supports development and regression testing of telecom ticket classification, priority prediction, privacy checks, and retrieval. It must not be used to claim production performance.

## Generation

`scripts/generate_dataset.py` combines controlled Turkish and English scenario templates with harmless variations. Each record includes a scenario group, language, channel, taxonomy labels, priority, structured entities, and `synthetic: true`. Generation is seeded and validates required fields, unique IDs, unique text, balanced language counts, and the synthetic marker.

## Splitting

Training uses scenario-template groups so near-identical template families do not cross the train/test boundary. The split is deterministic and reports language as well as class performance.

## Known gaps

Synthetic language is cleaner than customer conversations. Dialects, speech transcripts, spelling noise, code-switching, rare modem models, and operator-specific products are underrepresented.
