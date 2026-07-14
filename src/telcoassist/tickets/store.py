from threading import RLock
from typing import Any

from telcoassist.common.schemas import FeedbackCreate, Ticket
from telcoassist.tickets.seed import seed_tickets


class DemoStore:
    def __init__(self) -> None:
        self._lock = RLock()
        self.tickets = {ticket.id: ticket for ticket in seed_tickets()}
        self.feedback: list[dict[str, Any]] = []

    def list_tickets(self) -> list[Ticket]:
        return list(self.tickets.values())

    def get_ticket(self, ticket_id: str) -> Ticket | None:
        return self.tickets.get(ticket_id)

    def save_ticket(self, ticket: Ticket) -> Ticket:
        with self._lock:
            self.tickets[ticket.id] = ticket
        return ticket

    def add_feedback(self, feedback: FeedbackCreate) -> dict[str, Any]:
        item = {"id": f"FB-{len(self.feedback) + 1:04d}", **feedback.model_dump()}
        with self._lock:
            self.feedback.append(item)
        return item


store = DemoStore()
