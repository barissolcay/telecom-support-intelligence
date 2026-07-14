# Limitations

- All product and evaluation data is synthetic.
- Name and postal-address masking requires a separately evaluated NER adapter.
- The deterministic lexical demo ranker is not a substitute for production dense/sparse retrieval measurements.
- The API uses a deterministic taxonomy classifier; the offline TF-IDF artifact is not served by the runtime.
- Knowledge answers use constrained templates unless a reviewed LLM adapter is enabled.
- Uploaded PDF files remain drafts because the demo does not ship a PDF parser; plain-text,
  Markdown, and HTML guidance can be activated through the lexical index flow.
- Regional incident signals are statistical indicators, not network-root-cause diagnoses.
- There is no real operator integration, speech-to-text, packet inspection, or outbound messaging.
- Accessibility and internationalization require additional production audits.
