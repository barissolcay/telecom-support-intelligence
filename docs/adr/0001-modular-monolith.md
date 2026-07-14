# ADR 0001: Modular monolith for V1

Status: accepted

The V1 uses one FastAPI deployment with explicit domain modules. This preserves transactional ticket, message, resolution, and feedback writes while keeping future extraction boundaries visible. The web client is deployed separately. PostgreSQL is used by the Docker path; optional vector-search adapters stay outside the default request path until they have an evaluated end-to-end integration.
