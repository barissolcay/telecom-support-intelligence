from telcoassist.analytics.service import dashboard
from telcoassist.common.schemas import FeedbackCreate
from telcoassist.config.settings import get_settings
from telcoassist.tickets.seed import seed_tickets
from telcoassist.tickets.store import DatabaseStore, DemoStore


def test_dashboard_aggregates_live_ticket_state():
    tickets = seed_tickets()
    data = dashboard(tickets, 3)
    assert data["metrics"]["opened_today"] == len(tickets)
    assert sum(item["count"] for item in data["categories"]) == len(tickets)
    assert data["metrics"]["feedback_count"] == 3


def test_demo_store_round_trip():
    store = DemoStore()
    ticket = store.list_tickets()[0]
    ticket.status = "in_progress"
    assert store.save_ticket(ticket).status == "in_progress"
    feedback = store.add_feedback(FeedbackCreate(target_type="answer", target_id="A1", rating="useful"))
    assert feedback["id"] == "FB-0001"
    assert store.ping() is True
    assert store.close() is None


def test_database_store_persists_ticket_and_feedback(tmp_path, monkeypatch):
    database_path = (tmp_path / "store.db").as_posix()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")
    get_settings.cache_clear()
    store = None
    try:
        store = DatabaseStore()
        assert store.ping() is True
        ticket = store.list_tickets()[0]
        ticket.assigned_to = "Test Agent"
        store.save_ticket(ticket)
        assert store.get_ticket(ticket.id).assigned_to == "Test Agent"
        store.add_feedback(FeedbackCreate(target_type="priority", target_id=ticket.id, rating="accepted"))
        assert len(store.feedback) == 1
    finally:
        if store is not None:
            store.close()
        get_settings.cache_clear()
