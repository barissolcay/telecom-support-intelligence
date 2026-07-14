from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Message(BaseModel):
    author: Literal["customer", "agent", "system"]
    body: str
    created_at: str = Field(default_factory=now_iso)


class Ticket(BaseModel):
    id: str
    customer_id: str
    title: str
    channel: Literal["chat", "email", "call", "mobile_app"] = "chat"
    language: Literal["tr", "en"] = "tr"
    region: str = "Unknown"
    status: Literal["new", "in_progress", "waiting", "resolved"] = "new"
    assigned_to: str | None = None
    created_at: str = Field(default_factory=now_iso)
    category: str = "other"
    subcategory: str = "unclassified"
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    confidence: float = 0.0
    summary: str = ""
    redacted_text: str = ""
    entities: dict[str, Any] = Field(default_factory=dict)
    decision_signals: list[str] = Field(default_factory=list)
    messages: list[Message] = Field(default_factory=list)
    ai_reviewed: bool = False
    resolution: dict[str, Any] | None = None


class TicketCreate(BaseModel):
    channel: Literal["chat", "email", "call", "mobile_app"] = "chat"
    language: Literal["tr", "en"] = "tr"
    message: str = Field(min_length=5, max_length=10_000)
    region: str = "Unknown"


class Classification(BaseModel):
    category: str
    subcategory: str
    confidence: float
    requires_review: bool
    model_version: str = "tfidf-logreg-baseline-v1"


class PriorityPrediction(BaseModel):
    priority: Literal["low", "medium", "high", "critical"]
    confidence: float
    signals: list[str]
    model_version: str = "priority-rules-linear-v1"


class AnalysisResponse(BaseModel):
    ticket_id: str
    redacted_text: str
    classification: Classification
    priority: PriorityPrediction
    entities: dict[str, Any]
    summary: dict[str, Any]
    similar_cases: list[dict[str, Any]]
    suggested_follow_up: str | None


class CopilotQuery(BaseModel):
    ticket_id: str
    question: str = Field(min_length=3, max_length=2_000)


class FeedbackCreate(BaseModel):
    target_type: Literal["classification", "answer", "draft", "priority"]
    target_id: str
    rating: Literal["accepted", "edited", "rejected", "useful", "not_useful", "incorrect"]
    reason: str | None = None
    corrected_value: str | None = None


class ResolutionCreate(BaseModel):
    root_cause: str
    actions_taken: list[str]
    resolution: Literal["resolved", "escalated", "monitoring"]
    customer_informed: bool
    follow_up_required: bool
    escalation_team: str | None = None
    final_summary: str
