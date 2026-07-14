# Limitations

- All product and evaluation data is synthetic.
- Name and postal-address masking requires a separately evaluated NER adapter.
- The deterministic demo retriever approximates hybrid behavior but is not a substitute for production Qdrant measurements.
- Knowledge answers use constrained templates unless a reviewed LLM adapter is enabled.
- Regional incident signals are statistical indicators, not network-root-cause diagnoses.
- There is no real operator integration, speech-to-text, packet inspection, or outbound messaging.
- Accessibility and internationalization require additional production audits.
