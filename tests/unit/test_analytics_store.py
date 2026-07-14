from telcoassist.analytics.service import dashboard
from telcoassist.common.schemas import FeedbackCreate
from telcoassist.tickets.seed import seed_tickets
from telcoassist.tickets.store import DemoStore


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
