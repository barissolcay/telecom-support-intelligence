# ADR 0001: Modular monolith for V1

Status: accepted

The V1 uses one FastAPI deployment with explicit domain modules. This preserves transactional feedback and simple local operation while keeping future extraction boundaries visible. Web, API, worker, storage, vector search, and experiment tracking remain independently deployable processes where their operational characteristics differ.
