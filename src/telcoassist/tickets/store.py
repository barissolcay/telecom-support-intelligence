from datetime import datetime, timezone
from threading import RLock
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.orm import selectinload

from telcoassist.common.schemas import FeedbackCreate, Ticket
from telcoassist.config.settings import get_settings
from telcoassist.database.models import Base, FeedbackRecord, TicketMessageRecord, TicketRecord
from telcoassist.database.session import create_engine_and_session_factory
from telcoassist.tickets.seed import seed_tickets


class DemoStore:
    def __init__(self) -> None:
        self._lock = RLock()
        self.tickets = {ticket.id: ticket for ticket in seed_tickets()}
        self.feedback: list[dict[str, Any]] = []
        self._next_sequence = max(int(ticket_id.split("-")[1]) for ticket_id in self.tickets) + 1

    def list_tickets(self) -> list[Ticket]:
        with self._lock:
            return list(self.tickets.values())

    def get_ticket(self, ticket_id: str) -> Ticket | None:
        with self._lock:
            return self.tickets.get(ticket_id)

    def next_ticket_id(self) -> str:
        with self._lock:
            sequence = self._next_sequence
            self._next_sequence += 1
            return f"TK-{sequence}"

    def save_ticket(self, ticket: Ticket) -> Ticket:
        with self._lock:
            self.tickets[ticket.id] = ticket
        return ticket

    def add_feedback(self, feedback: FeedbackCreate) -> dict[str, Any]:
        with self._lock:
            item = {"id": f"FB-{len(self.feedback) + 1:04d}", **feedback.model_dump()}
            self.feedback.append(item)
        return item

    def ping(self) -> bool:
        return True

    def close(self) -> None:
        return None


def _to_database_datetime(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc).replace(tzinfo=None)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _to_api_datetime(value: datetime) -> str:
    return value.replace(tzinfo=timezone.utc).isoformat()


class DatabaseStore:
    """Small SQLAlchemy repository used by the Docker-backed demo."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._engine, self._sessions = create_engine_and_session_factory()
        Base.metadata.create_all(self._engine)
        with self._sessions() as session:
            has_tickets = session.scalar(select(func.count()).select_from(TicketRecord)) > 0
        if not has_tickets:
            for ticket in seed_tickets():
                self.save_ticket(ticket)
        ids = [ticket.id for ticket in self.list_tickets()]
        self._next_sequence = max((int(ticket_id.split("-")[1]) for ticket_id in ids), default=1049) + 1
        with self._sessions() as session:
            self._next_feedback_sequence = session.scalar(
                select(func.count()).select_from(FeedbackRecord)
            ) + 1

    def list_tickets(self) -> list[Ticket]:
        statement = (
            select(TicketRecord)
            .options(selectinload(TicketRecord.messages))
            .order_by(TicketRecord.created_at.desc())
        )
        with self._sessions() as session:
            return [self._to_ticket(record) for record in session.scalars(statement)]

    def ping(self) -> bool:
        with self._sessions() as session:
            session.execute(text("SELECT 1"))
        return True

    def close(self) -> None:
        self._engine.dispose()

    def get_ticket(self, ticket_id: str) -> Ticket | None:
        statement = (
            select(TicketRecord)
            .where(TicketRecord.id == ticket_id)
            .options(selectinload(TicketRecord.messages))
        )
        with self._sessions() as session:
            record = session.scalar(statement)
            return self._to_ticket(record) if record else None

    def next_ticket_id(self) -> str:
        with self._lock:
            sequence = self._next_sequence
            self._next_sequence += 1
            return f"TK-{sequence}"

    def save_ticket(self, ticket: Ticket) -> Ticket:
        with self._lock, self._sessions.begin() as session:
            record = session.get(TicketRecord, ticket.id)
            if record is None:
                record = TicketRecord(id=ticket.id, customer_id=ticket.customer_id)
                session.add(record)
            record.customer_id = ticket.customer_id
            record.title = ticket.title
            record.channel = ticket.channel
            record.language = ticket.language
            record.raw_text_encrypted = None
            record.redacted_text = ticket.redacted_text
            record.summary = ticket.summary
            record.category = ticket.category
            record.subcategory = ticket.subcategory
            record.confidence = ticket.confidence
            record.priority = ticket.priority
            record.status = ticket.status
            record.assigned_to = ticket.assigned_to
            record.region = ticket.region
            record.entities = ticket.entities
            record.decision_signals = ticket.decision_signals
            record.ai_reviewed = ticket.ai_reviewed
            record.resolution = ticket.resolution
            record.created_at = _to_database_datetime(ticket.created_at)
            record.messages.clear()
            record.messages.extend(
                TicketMessageRecord(
                    sender_type=message.author,
                    raw_text_encrypted=None,
                    redacted_text=message.body,
                    created_at=_to_database_datetime(message.created_at),
                )
                for message in ticket.messages
            )
        return ticket

    def add_feedback(self, feedback: FeedbackCreate) -> dict[str, Any]:
        with self._lock, self._sessions.begin() as session:
            sequence = self._next_feedback_sequence
            self._next_feedback_sequence += 1
            item = {"id": f"FB-{sequence:04d}", **feedback.model_dump()}
            session.add(FeedbackRecord(**item))
        return item

    @property
    def feedback(self) -> list[dict[str, Any]]:
        with self._sessions() as session:
            records = session.scalars(select(FeedbackRecord)).all()
            return [
                {
                    "id": record.id,
                    "target_type": record.target_type,
                    "target_id": record.target_id,
                    "rating": record.rating,
                    "reason": record.reason,
                    "corrected_value": record.corrected_value,
                }
                for record in records
            ]

    @staticmethod
    def _to_ticket(record: TicketRecord) -> Ticket:
        messages = sorted(record.messages, key=lambda message: message.created_at)
        return Ticket(
            id=record.id,
            customer_id=record.customer_id,
            title=record.title,
            channel=record.channel,
            language=record.language,
            region=record.region or "Unknown",
            status=record.status,
            assigned_to=record.assigned_to,
            created_at=_to_api_datetime(record.created_at),
            category=record.category,
            subcategory=record.subcategory,
            priority=record.priority,
            confidence=record.confidence,
            summary=record.summary,
            redacted_text=record.redacted_text,
            entities=record.entities or {},
            decision_signals=record.decision_signals or [],
            messages=[
                {
                    "author": message.sender_type,
                    "body": message.redacted_text,
                    "created_at": _to_api_datetime(message.created_at),
                }
                for message in messages
            ],
            ai_reviewed=record.ai_reviewed,
            resolution=record.resolution,
        )


def create_store() -> DemoStore | DatabaseStore:
    return DatabaseStore() if get_settings().storage_backend == "database" else DemoStore()


store = create_store()
