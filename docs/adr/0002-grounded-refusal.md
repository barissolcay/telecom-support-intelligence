# ADR 0002: Evidence-gated generation

Status: accepted

Copilot guidance is generated only after active knowledge passes a configured retrieval threshold. When no source qualifies, the API returns an insufficient-evidence response and no troubleshooting steps. Retrieved document text is always treated as untrusted data and cannot modify system policy.
