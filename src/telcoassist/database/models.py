from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TicketRecord(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    customer_id: Mapped[str] = mapped_column(String(32), index=True)
    channel: Mapped[str] = mapped_column(String(24))
    language: Mapped[str] = mapped_column(String(8))
    raw_text_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    redacted_text: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64), index=True)
    subcategory: Mapped[str] = mapped_column(String(64), index=True)
    priority: Mapped[str] = mapped_column(String(16), index=True)
    status: Mapped[str] = mapped_column(String(24), index=True)
    assigned_to: Mapped[str | None] = mapped_column(String(64), nullable=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    predictions: Mapped[list["TicketPredictionRecord"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    messages: Mapped[list["TicketMessageRecord"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")


class TicketPredictionRecord(Base):
    __tablename__ = "ticket_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    model_name: Mapped[str] = mapped_column(String(64))
    model_version: Mapped[str] = mapped_column(String(32))
    predicted_category: Mapped[str] = mapped_column(String(64))
    predicted_subcategory: Mapped[str] = mapped_column(String(64))
    predicted_priority: Mapped[str] = mapped_column(String(16))
    category_confidence: Mapped[float] = mapped_column(Float)
    priority_confidence: Mapped[float] = mapped_column(Float)
    entities: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ticket: Mapped[TicketRecord] = relationship(back_populates="predictions")


class TicketMessageRecord(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    sender_type: Mapped[str] = mapped_column(String(16))
    raw_text_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    redacted_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ticket: Mapped[TicketRecord] = relationship(back_populates="messages")


class KnowledgeDocumentRecord(Base):
    __tablename__ = "knowledge_documents"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    source_type: Mapped[str] = mapped_column(String(24))
    product: Mapped[str] = mapped_column(String(64), index=True)
    language: Mapped[str] = mapped_column(String(8), index=True)
    version: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(24), index=True)
    effective_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class DocumentChunkRecord(Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("knowledge_documents.id", ondelete="CASCADE"), index=True)
    section: Mapped[str] = mapped_column(String(255))
    page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer)
    vector_id: Mapped[str] = mapped_column(String(64), unique=True)


class AIAnswerRecord(Base):
    __tablename__ = "ai_answers"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(24))
    insufficient_context: Mapped[bool] = mapped_column(Boolean, default=False)
    model_version: Mapped[str] = mapped_column(String(32))
    prompt_version: Mapped[str] = mapped_column(String(32))
    latency_ms: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AnswerCitationRecord(Base):
    __tablename__ = "answer_citations"

    answer_id: Mapped[str] = mapped_column(ForeignKey("ai_answers.id", ondelete="CASCADE"), primary_key=True)
    document_chunk_id: Mapped[str] = mapped_column(ForeignKey("document_chunks.id", ondelete="CASCADE"), primary_key=True)
    retrieval_score: Mapped[float] = mapped_column(Float)
    rerank_score: Mapped[float] = mapped_column(Float)


class FeedbackRecord(Base):
    __tablename__ = "feedback"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    target_type: Mapped[str] = mapped_column(String(24), index=True)
    target_id: Mapped[str] = mapped_column(String(48), index=True)
    user_id: Mapped[str | None] = mapped_column(String(48), nullable=True)
    rating: Mapped[str] = mapped_column(String(24))
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    corrected_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
