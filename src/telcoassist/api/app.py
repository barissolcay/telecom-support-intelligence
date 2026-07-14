import time
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from telcoassist.analytics.service import dashboard
from telcoassist.classification.service import classify
from telcoassist.common.schemas import (
    AnalysisResponse,
    Classification,
    CopilotQuery,
    FeedbackCreate,
    PriorityPrediction,
    ResolutionCreate,
    Ticket,
    TicketCreate,
)
from telcoassist.config.settings import get_settings
from telcoassist.entities.extractor import extract_entities, follow_up_question
from telcoassist.knowledge.catalog import DOCUMENTS
from telcoassist.priority.service import predict_priority
from telcoassist.privacy.redaction import redact
from telcoassist.rag.service import answer
from telcoassist.retrieval.service import hybrid_search
from telcoassist.tickets.seed import SIMILAR_CASES
from telcoassist.tickets.store import store


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title="TelcoAssist API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:8080"], allow_methods=["*"], allow_headers=["*"])
settings = get_settings()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "telcoassist-api", "version": "1.0.0"}


@app.get("/ready")
def ready() -> dict:
    return {"status": "ready", "model": "tfidf-logreg-baseline-v1", "knowledge_documents": len([d for d in DOCUMENTS if d["status"] == "active"]), "mode": "synthetic-demo"}


@app.get("/api/v1/tickets", response_model=list[Ticket])
def list_tickets() -> list[Ticket]:
    return store.list_tickets()


@app.get("/api/v1/tickets/{ticket_id}", response_model=Ticket)
def get_ticket(ticket_id: str) -> Ticket:
    ticket = store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    return ticket


@app.post("/api/v1/tickets", response_model=Ticket, status_code=201)
def create_ticket(payload: TicketCreate) -> Ticket:
    redacted, _ = redact(payload.message)
    result = classify(redacted)
    priority = predict_priority(redacted, result.category)
    ticket_id = f"TK-{1050 + len(store.list_tickets())}"
    entities = extract_entities(redacted, result.category)
    ticket = Ticket(
        id=ticket_id, customer_id=f"CUST-{ticket_id[-4:]}", title=redacted[:55], channel=payload.channel,
        language=payload.language, region=payload.region, category=result.category, subcategory=result.subcategory,
        priority=priority.priority, confidence=result.confidence, redacted_text=redacted,
        summary=redacted.split(".")[0].strip() + ".", entities=entities, decision_signals=priority.signals,
        messages=[{"author": "customer", "body": redacted}], ai_reviewed=result.confidence >= .6,
    )
    return store.save_ticket(ticket)


@app.post("/api/v1/tickets/{ticket_id}/analyze", response_model=AnalysisResponse)
def analyze_ticket(ticket_id: str) -> AnalysisResponse:
    ticket = get_ticket(ticket_id)
    text = " ".join(message.body for message in ticket.messages if message.author == "customer")
    redacted, _ = redact(text)
    result = classify(redacted)
    priority = predict_priority(redacted, result.category)
    entities = extract_entities(redacted, result.category)
    cases = hybrid_search(redacted, SIMILAR_CASES, product=result.category, limit=3)
    ticket.category, ticket.subcategory, ticket.confidence = result.category, result.subcategory, result.confidence
    ticket.priority, ticket.decision_signals, ticket.entities = priority.priority, priority.signals, entities
    ticket.redacted_text, ticket.summary, ticket.ai_reviewed = redacted, redacted.split(".")[0] + ".", True
    store.save_ticket(ticket)
    return AnalysisResponse(
        ticket_id=ticket.id, redacted_text=redacted,
        classification=Classification(category=result.category, subcategory=result.subcategory, confidence=result.confidence, requires_review=result.confidence < .6),
        priority=PriorityPrediction(priority=priority.priority, confidence=priority.confidence, signals=priority.signals),
        entities=entities,
        summary={"issue": ticket.summary, "customer_actions": [entities["customer_action"]] if "customer_action" in entities else [], "impact": "Service degraded" if result.subcategory == "speed_degradation" else "Requires agent review", "missing_information": ["Connection type", "Modem model", "Location"]},
        similar_cases=cases, suggested_follow_up=follow_up_question(entities, result.category, ticket.language),
    )


@app.get("/api/v1/tickets/{ticket_id}/similar-cases")
def similar_cases(ticket_id: str, limit: int = 5, region: str | None = None, resolved_only: bool = True, min_similarity: float = 0.0) -> list[dict]:
    ticket = get_ticket(ticket_id)
    results = hybrid_search(ticket.redacted_text, SIMILAR_CASES, product=ticket.category, limit=limit)
    return [item for item in results if item["similarity"] >= min_similarity and (not region or item["region"] == region) and (not resolved_only or item["outcome"] == "resolved")]


@app.post("/api/v1/copilot/query")
def copilot_query(payload: CopilotQuery) -> dict:
    started = time.perf_counter()
    ticket = get_ticket(payload.ticket_id)
    result = answer(f"{ticket.redacted_text} {payload.question}", ticket.category, settings.retrieval_min_score)
    result["latency_ms"] = round((time.perf_counter() - started) * 1000, 2)
    return result


@app.post("/api/v1/feedback", status_code=201)
def create_feedback(payload: FeedbackCreate) -> dict:
    return store.add_feedback(payload)


@app.post("/api/v1/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, payload: ResolutionCreate) -> Ticket:
    ticket = get_ticket(ticket_id)
    ticket.status = "resolved"
    ticket.resolution = payload.model_dump()
    return store.save_ticket(ticket)


@app.get("/api/v1/knowledge/documents")
def list_documents() -> list[dict]:
    return [{**doc, "chunk_count": 12 if doc["status"] == "active" else 4, "usage_count": 17 if doc["status"] == "active" else 0, "index_status": "indexed"} for doc in DOCUMENTS]


@app.post("/api/v1/knowledge/documents", status_code=201)
async def upload_document(file: Annotated[UploadFile, File()]) -> dict:
    allowed = {"application/pdf", "text/plain", "text/markdown", "text/html"}
    if file.content_type not in allowed:
        raise HTTPException(415, "Unsupported document type")
    content = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "Document exceeds upload limit")
    return {"id": f"DOC-{len(DOCUMENTS) + 1:03d}", "title": file.filename, "status": "draft", "index_status": "uploaded", "size": len(content)}


@app.post("/api/v1/knowledge/documents/{document_id}/index")
def index_document(document_id: str) -> dict:
    return {"id": document_id, "index_status": "indexed", "stages": ["parsing", "chunking", "embedding", "indexed"]}


@app.get("/api/v1/analytics/dashboard")
def get_dashboard() -> dict:
    return dashboard(store.list_tickets(), len(store.feedback))
