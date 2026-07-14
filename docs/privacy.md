# Privacy

The synthetic dataset contains no intentional real PII. Runtime input is redacted with validated patterns for phone numbers, e-mail addresses, IP and MAC addresses, national identifiers, subscriber references, and payment-card-like values. Repeated values receive stable placeholders within one processing call.

Raw text must remain restricted to the ingestion boundary. Logs, feedback, retrieval queries, prompts, screenshots, model artifacts, and third-party calls use redacted content. Regex coverage is complemented by a future NER adapter for names and addresses; this limitation is explicit because name/address detection requires operator-specific evaluation.
